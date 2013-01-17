zmq = require("zmq");
bsonParser = require("bson").BSONPure.BSON;

var consts = {
    // common with java codebase (?)
    // IP here should move to some config file
    MGMT_SERVER_CONFIG: ":5005",
    MGMT_SERVER_CMD: ":5003", 
    MGMT_SERVER_STATS: ":5000",
    
    CONFIG_REMOVE_QUEUE: 2001,
    CONFIG_STOP_QUEUE: 2002,
    CONFIG_CREATE_QUEUE: 2003,
    CONFIG_START_QUEUE: 2005,
    CONFIG_AS_CREATE_RULE: 2006,
    CONFIG_AS_DESCRIBE_RULE: 2007,
    
    MNGT_UPDATE_CONFIG: "1500",
    BSON_CONFIG_GET_HOST_BY_QNAME: 2000,
    
    BSON_MONITOR_HOST: "Monitor_host",
    BSON_STAT_MONITOR_HOST: "Stat_Monitor_host",
    
    // defined only here
    MESSAGE_CMD: "CMD",
    MESSAGE_QUEUES: "Queues",
    MESSAGE_HOSTS: "Hosts",
    MESSAGE_QNAME: "QName",
    MESSAGE_HOST: "Host",
    MESSAGE_AS_NAME: "AUTOSCALING_NAME",
    MESSAGE_AS_HOST: "AUTOSCALING_HOST",
    MESSAGE_AS_XCHANGE: "AUTOSCALING_XCHANGE",
    MESSAGE_AS_Q: "AUTOSCALING_Q",
}


// we should have an extra wrapper between this and the zmq stuff
// what do we need?
// - proper message formatting for RoQ ('cause it's quite ugly from a JS point of view)
// - bson conversion

module.exports = function setup(options, imports, register) {
    var logger = options.logger;
    var mgmtControllerAddress = "127.0.0.1"; // sensible default
    var socketMgmtContr; 
    var socketQueueStats = {};
    var queuesWithStatSocket = [];
    var listenersClusterStatus = [];

    var init = function(){
        logger.trace("starting connector");
        register(null,{
            'roq-connector': {
                connect: connect,
                subscribeClusterStatus: subscribeClusterStatus,
                subscribeQueueStatistics: subscribeQueueStatistics,
                removeQueue: removeQueue,
                stopQueue: stopQueue,
                startQueue: startQueue,
                createQueue: createQueue,
                autoscalingCreateRule: autoscalingCreateRule,
                autoscalingDescribeRule: autoscalingDescribeRule,
                closeSockets: closeSockets,
                //consts: consts,
            }
        });
    }
    
    var connect = function(mgmtAddr){
        logger.trace("connect");
        mgmtControllerAddress = mgmtAddr || mgmtControllerAddress;
        initClusterStatus();
    }

    var closeSockets = function(){
        if(socketMgmtContr) 
            socketMgmtContr.close();
        for(var i in queuesWithStatSocket){
            socketQueueStats[queuesWithStatSocket[i]].socket.close();
        }
    }
    
    var initClusterStatus = function(){
        socketMgmtContr = zmq.socket('sub');
        socketMgmtContr.connect("tcp://"+mgmtControllerAddress+consts.MGMT_SERVER_CONFIG);
        socketMgmtContr.subscribe("");
        
        logger.info("registering Cluster Status message receiving on "+mgmtControllerAddress+consts.MGMT_SERVER_CONFIG);
        socketMgmtContr.on('message', parseClusterStatus);
    }
    
    var parseClusterStatus = function(){
        
        var message = [];
        for(var i in arguments){
            message.push(bsonParser.deserialize(arguments[i]));
        }
        //logger.info('message:',message);
        
        var cmd = message[0][consts.MESSAGE_CMD];
        
        if( cmd == consts.MNGT_UPDATE_CONFIG){           
            var msgToSend = {};
            msgToSend[consts.MESSAGE_HOSTS] = message[2][consts.MESSAGE_HOSTS];
            msgToSend[consts.MESSAGE_QUEUES] = message[1][consts.MESSAGE_QUEUES];
            
            for(var i in listenersClusterStatus){
                listenersClusterStatus[i](msgToSend);
            }
        }else{
                logger.error("Unknown message type: "+cmd+".");
        }
    }
    
    var subscribeClusterStatus = function(listener){
        listenersClusterStatus.push(listener);
    }
    
    // "Statistic subscription"
    var subscribeQueueStatistics = function(queueName, callback, listener){
        if( 0 <= queuesWithStatSocket.indexOf(queueName)){
            socketQueueStats[queueName].listeners.push(listener);
            return callback(listener);
        }
        socketQueueStats[queueName] = {};  
        socketQueueStats[queueName].listeners = [listener];  
        
        var sock = zmq.socket('req');
        sock.connect("tcp://"+mgmtControllerAddress+consts.MGMT_SERVER_STATS);
        
        
        var msgReqSubscribe = {};
        msgReqSubscribe[consts.MESSAGE_CMD] = consts.BSON_CONFIG_GET_HOST_BY_QNAME;
        msgReqSubscribe[consts.MESSAGE_QNAME] = queueName;
        
        msgReqSubscribe = bsonParser.serialize(msgReqSubscribe);
        
        // send request for config
        sock.send(msgReqSubscribe);
        
        // get answer
        sock.on('message',function(){
            var bsonDConf = safeBSONread(arguments[0]);        
            if(!bsonDConf)
                return callback("Unable to subscribe");
                
            logger.info("received dconf:",bsonDConf);
            
            var sockMonHost = zmq.socket('sub');
            sockMonHost.connect(bsonDConf[consts.BSON_STAT_MONITOR_HOST]);
            sockMonHost.subscribe("");
            sockMonHost.on('message',function(){
                //logger.trace("Stats for "+queueName);
                var msg = decodeQueueStatMessage(arguments);
                if(null != msg){
                    for(var i in socketQueueStats[queueName].listeners){
                        socketQueueStats[queueName].listeners[i](null,msg);
                    }
                }
            });
            
            socketQueueStats[queueName].socket = sockMonHost;
            sock.close();
            
            callback(listener);
        });
    }
    
    var unsubscribeQueueStatistics = function(queueName,listener){
        logger.trace("unsubscribeQueueStatistics for "+queueName);
        
        // removing listeners
        for(var i in socketQueueStats[queueName].listeners){
            if(listener == socketQueueStats[queueName].listeners[i]){
                logger.trace("unsubscribelistener "+i);
                delete socketQueueStats[queueName].listeners[i];
            }
        }
        
        // no listeners left? Disconnect and remove the socket
        if( 0 == socketQueueStats[queueName].length){
            logger.trace("delete socket for  "+queueName);
            socketQueueStats[queueName].socket.disconnect();
            delete socketQueueStats[queueName];
        }
    }
    
    // decode stat messages
    // the idea is to always send the same 
    // object to listeners, with two attributes
    // - stats: queue statistics
    // - exchange: exchange with his stats & load
    var decodeQueueStatMessage = function(args){
        var msg = [];
        var data = {
            exchange:null,
            stats:null
        };
        
        // decode each part of the multipart message
        for(var j in args)
            msg[j] = safeBSONread(args[j]);
        
        // clean up empty parts (i.e. BSON read failed)
        for(var j=msg.length-1;j>=0;j--)
            if(null == msg[j])
                delete msg[j];
         
        // do we actually have a readable message?
        if(!msg.length){
            return null;
            
        }else if(20 == msg[0][consts.MESSAGE_CMD]){
            // three-part message with CMDs 20, 21 and 22
            //queueName = msg[0][consts.MESSAGE_QNAME],
            
            delete msg[2][consts.MESSAGE_CMD];
            delete msg[1][consts.MESSAGE_CMD];
            
            data.exchange = {
                name:  msg[0]['X_ID'],
                stats: msg[1],
                load:  msg[2]
            }
            
        }else if(23 == msg[0][consts.MESSAGE_CMD]){
            delete msg[0][consts.MESSAGE_CMD];
            data.stats = msg[0];
        }
        
        return data;
    }
    
    var safeBSONread = function(data){
        try{
            return bsonParser.deserialize(data);        
        }catch(error){
            logger.error("Couldn't deserialize message: ",data,". Message:",error);
            return null;
        }
    }

    
    var removeQueue = function(queueName,callback){
        logger.info("removeQueue");
        sendMgmtControllerRequest(makeMessage(
                    consts.MESSAGE_CMD,consts.CONFIG_REMOVE_QUEUE,
                    consts.MESSAGE_QNAME,queueName)
                    ,callback);
    }         
    var stopQueue = function(queueName,callback){
        logger.info("stopQueue");
        sendMgmtControllerRequest(makeMessage(
                    consts.MESSAGE_CMD,consts.CONFIG_STOP_QUEUE,
                    consts.MESSAGE_QNAME,queueName)
                    ,callback);
    }           
    var startQueue = function(queueName,callback){
        logger.info("startQueue");
        sendMgmtControllerRequest(makeMessage(
                    consts.MESSAGE_CMD,consts.CONFIG_START_QUEUE,
                    consts.MESSAGE_QNAME,queueName)
                    ,callback);
    }    
    var createQueue = function(queueName,host,callback){
        logger.info("createQueue");
        sendMgmtControllerRequest(makeMessage(
                    consts.MESSAGE_CMD,consts.CONFIG_CREATE_QUEUE,
                    consts.MESSAGE_QNAME,queueName,
                    consts.MESSAGE_HOST,host),callback);
    } 
    var autoscalingDescribeRule = function(queueName,callback){
         sendMgmtControllerRequest(makeMessage(
                    consts.MESSAGE_CMD,consts.CONFIG_AS_DESCRIBE_RULE,
                    consts.MESSAGE_QNAME,queueName)),callback;
    }
    
    
    var autoscalingCreateRule = function(
            queueName,asName,hostCPU,hostRAM,
            xchangeThr,queueThrProd,queueQProd,
            callback){
        logger.info("autoscalingCreateRule");
        for(i=2; i <=6; i++)
            if( 'number' != typeof(arguments[i]) )
                callback("Please provide numbers for metric arguments.",null);
        sendMgmtControllerRequest(makeMessage(
                    consts.MESSAGE_CMD,consts.CONFIG_AS_CREATE_RULE,
                    consts.MESSAGE_QNAME,queueName,
                    consts.MESSAGE_AS_NAME,asName,
                    consts.MESSAGE_AS_HOST,{ 
                        "AUTOSCALING_HOST_CPU" : hostCPU , 
                        "AUTOSCALING_HOST_RAM" : hostRAM
                        },
                    consts.MESSAGE_AS_XCHANGE,{ 
                        "AUTOSCALING_XCHANGE_THR" : xchangeThr
                        } , 
                    consts.MESSAGE_AS_Q,{ 
                        "AUTOSCALING_THR_PROD_EXCH" : queueThrProd , 
                        "AUTOSCALING_Q_PROD_EXCH" : queueQProd
                        }
                    ),callback);
    }  
    
    // even arguments will be used as keys, odd one will be used as values
    var makeMessage = function(){
        if( 0 != arguments.length % 2){
            throw "makeMessage require an even number of arguments.";
        }
        var msg = {};
        var len = arguments.length/2;
        for(var i=0; i<len; i++){
            msg[arguments[i*2]] = arguments[i*2+1];
        }
//        logger.info("message",msg);
        return msg;
    }
    
    var sendMgmtControllerRequest = function(request,callback){
        var sock = zmq.socket('req');
        sock.connect("tcp://"+mgmtControllerAddress+consts.MGMT_SERVER_CMD);

        logger.info("will send:",request);
        var msg = bsonParser.serialize(request);
        
        sock.send(msg);
        
        if('function' != typeof(callback)) callback = function(){};
        
        sock.on('message',function(){
            if(arguments[0]){
                var answer = bsonParser.deserialize(arguments[0]);
                if(undefined != answer.RESULT){
                    if( 0 == answer.RESULT){
                        logger.info("request sent successfully. Comment: "+answer.COMMENT);
                        callback(null);
                    }else{
                        logger.warn("failed to send request. "+answer.COMMENT);
                        callback({message:'RoQ failed to fulfill request.',RoQAnswer:answer});
                    }
                }else{
                     logger.warn("received non-standard reply.",answer);
                }
            }else{
                logger.warn("received empty answer.");
                callback({message:"RoQ did not answer the request."});
            }
            sock.close();
        });
        
        
    }
    
    
    init();
}
