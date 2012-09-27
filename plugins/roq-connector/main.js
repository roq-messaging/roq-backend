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
    
    MNGT_UPDATE_CONFIG: "1500",
    BSON_CONFIG_GET_HOST_BY_QNAME: 2000,
    
    BSON_MONITOR_HOST: "Monitor_host",
    BSON_STAT_MONITOR_HOST: "Stat_Monitor_host",
    
    // defined only here
    //MGMT_SERVER_CMD: "localhost:5003",
    MESSAGE_CMD: "CMD",
    MESSAGE_QUEUES: "Queues",
    MESSAGE_HOSTS: "Hosts",
    MESSAGE_QNAME: "QName",
    MESSAGE_HOST: "Host",
}


// we should have an extra wrapper between this and the zmq stuff
// what do we need?
// - proper message formatting for RoQ ('cause it's quite ugly from a JS point of view)
// - bson conversion

module.exports = function setup(options, imports, register) {

    var mgmtControllerAddress = "127.0.0.1"; // sensible default
    var socketMgmtContr; 
    var socketQueueStats = {};
    var queuesWithStatSocket = [];
    var listenersClusterStatus = [];

    var init = function(){
        register(null,{
            'roq-connector': {
                connect: connect,
                subscribeClusterStatus: subscribeClusterStatus,
                subscribeQueueStatistics: subscribeQueueStatistics,
                autoSubscribeQueuesStatistics: autoSubscribeQueuesStatistics,
                removeQueue: removeQueue,
                stopQueue: stopQueue,
                startQueue: startQueue,
                createQueue: createQueue,
                closeSockets: closeSockets,
                //consts: consts,
            }
        });
    }
    
    var connect = function(mgmtAddr){
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
        
        console.log("registering GCM message receiving on "+mgmtControllerAddress+consts.MGMT_SERVER_CONFIG);
        socketMgmtContr.on('message', parseClusterStatus);
    }
    
    var parseClusterStatus = function(){
        
        var message = [];
        for(var i in arguments){
            message.push(bsonParser.deserialize(arguments[i]));
        }
        //console.log('message:',message);
        
        var cmd = message[0][consts.MESSAGE_CMD];
        
        if( cmd == consts.MNGT_UPDATE_CONFIG){           
            var msgToSend = {};
            msgToSend[consts.MESSAGE_HOSTS] = message[2][consts.MESSAGE_HOSTS];
            msgToSend[consts.MESSAGE_QUEUES] = message[1][consts.MESSAGE_QUEUES];
            
            for(var i in listenersClusterStatus){
                listenersClusterStatus[i](msgToSend);
            }
        }else{
                console.error("Unknown message type: "+cmd+".");
        }
    }
    
    var subscribeClusterStatus = function(listener){
        listenersClusterStatus.push(listener);
    }
    
    // "Statistic subscription"
    var subscribeQueueStatistics = function(queueName, listener){
        if( 0 <= queuesWithStatSocket.indexOf(queueName)){
            socketQueueStats[queueName].listeners.push(listener);
            return;
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
            if(!bsonDConf){
                listener("Unable to subscribe",null);
                return;
            }
                
            console.log("received dconf:",bsonDConf);
            
            var sockMonHost = zmq.socket('sub');
            sockMonHost.connect(bsonDConf[consts.BSON_STAT_MONITOR_HOST]);
            sockMonHost.subscribe("");
            sockMonHost.on('message',function(){
                console.log("Stats for "+queueName);
                /*for(var i in arguments){
                    console.log(i,bsonParser.deserialize(arguments[i]));
                }*/
                
                for(var i in socketQueueStats[queueName].listeners){
                    socketQueueStats[queueName].listeners[i](null,
                    safeBSONread(arguments[0]),
                    safeBSONread(arguments[1]),
                    safeBSONread(arguments[2])
                    );
                }
            });
            
            socketQueueStats[queueName].socket = sockMonHost;
            sock.close();
            
        });
    }
    
    var safeBSONread = function(data){
        try{
            return bsonParser.deserialize(data);        
        }catch(error){
            console.error("Couldn't deserialize message: ",data,". Message:",error);
            return null;
        }
    }
    
    var createMessage = function(cmd,payloads){
        var finalMsg = [];
        finalMsg.push(bsonParser.serialize(createMessagePart(consts.MESSAGE_CMD,cmd)));
        for(var i in payloads){
            finalMsg.push(bsonParser.serialize(payloads[i]));
        }
        
        return finalMsg;
    }
    
    var createMessagePart = function(ID,data){
        var part = {};
        part[ID] = data;
        return part;
    }
    
    var autoSubscribeQueuesStatistics = function(listener){
        // TODO
        // this automatically subscribes an observer to
        // every newly detected queue
    }   
    
    var removeQueue = function(queueName,callback){
        sendMgmtControllerRequest(makeMessage(
                    consts.MESSAGE_CMD,consts.CONFIG_REMOVE_QUEUE,
                    consts.MESSAGE_QNAME,queueName)
                    ,callback);
    }         
    var stopQueue = function(queueName,callback){
        sendMgmtControllerRequest(makeMessage(
                    consts.MESSAGE_CMD,consts.CONFIG_STOP_QUEUE,
                    consts.MESSAGE_QNAME,queueName)
                    ,callback);
    }           
    var startQueue = function(queueName,callback){
        sendMgmtControllerRequest(makeMessage(
                    consts.MESSAGE_CMD,consts.CONFIG_START_QUEUE,
                    consts.MESSAGE_QNAME,queueName)
                    ,callback);
    }    
    var createQueue = function(queueName,host,callback){
        sendMgmtControllerRequest(makeMessage(
                    consts.MESSAGE_CMD,consts.CONFIG_CREATE_QUEUE,
                    consts.MESSAGE_QNAME,queueName,
                    consts.MESSAGE_HOST,host),callback);
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
//        console.log("message",msg);
        return msg;
    }
    
    var sendMgmtControllerRequest = function(request,callback){
        var sock = zmq.socket('req');
        sock.connect("tcp://"+mgmtControllerAddress+consts.MGMT_SERVER_CMD);

        console.log("will send:",request);
        var msg = bsonParser.serialize(request);
        
        sock.send(msg);
        
        sock.on('message',function(){
                if(arguments[0]){
                    var answer = bsonParser.deserialize(arguments[0]);
                    if( 0 == answer.RESULT){
                        console.log("request sent successfully. Comment: "+answer.COMMENT);
                        if('function' == typeof(callback)) 
                            callback(null);
                    }else{
                        console.log("failed to send request. "+answer.COMMENT);
                        if('function' == typeof(callback)) 
                            callback({code:answer.RESULT,message:answer.COMMENT});
                    }
                }else{
                    console.log("received empty answer.");
                    if('function' == typeof(callback)) 
                            callback({code:-1,message:"received empty answer"});
                }
            sock.close();
        });
        
        
    }
    
    
    init();
}
