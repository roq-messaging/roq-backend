zmq = require("zmq");
bsonParser = require("bson").BSONPure.BSON;

var consts = {
    // common with java codebase
    GCM_SERVER: "127.0.0.1:5005",
    GCM_SERVER_CMD: "127.0.0.1:5003", // ?
    CONFIG_SERVER: "127.0.0.1:5000",
    
    CONFIG_REMOVE_QUEUE: 2001,
    CONFIG_STOP_QUEUE: 2002,
    CONFIG_CREATE_QUEUE: 2003,
    
    MNGT_UPDATE_CONFIG: "1500",
    BSON_CONFIG_GET_HOST_BY_QNAME: "2000",
    
    BSON_STAT_MONITOR_HOST: "Stat_Monitor_host",
    
    // defined only here
    //GCM_SERVER_CMD: "localhost:5003",
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

    var socketGCM; // Global Configuration Manager
    var socketQueueStats = {};
    var listenersGCM = [];

    var init = function(){
        initGCM(); // this is for the update_config messages. Should be renamed(?)
        
        
        register(null,{
            'roq-connector': {
                subscribeClusterStatus: subscribeClusterStatus,
                subscribeQueueStatistics: subscribeQueueStatistics,
                autoSubscribeQueuesStatistics: autoSubscribeQueuesStatistics,
                removeQueue: removeQueue,
                stopQueue: stopQueue,
                createQueue: createQueue,
                consts: consts,
            }
        });
    }
    
    var initGCM = function(){
        socketGCM = zmq.socket('sub');
        socketGCM.connect("tcp://"+consts.GCM_SERVER);
        socketGCM.subscribe("");
        
        console.log("registering GCM message receiving on "+consts.GCM_SERVER);
        socketGCM.on('message', parseGCMmessage);
    }
    
    var parseGCMmessage = function(){
        
        var message = [];
        for(var i in arguments){
            message.push(bsonParser.deserialize(arguments[i]));
        }
        //console.log('message:',message);
        
        var cmd = message[0][consts.MESSAGE_CMD];
        
        if( cmd == consts.MNGT_UPDATE_CONFIG){
            /*console.log("Received MNGT_UPDATE_CONFIG. Hosts:",
                    message[2][consts.MESSAGE_HOSTS],
                    " ; Queues: ",message[1][consts.MESSAGE_QUEUES]);*/
            
            var msgToSend = {};
            msgToSend[consts.MESSAGE_HOSTS] = message[2][consts.MESSAGE_HOSTS];
            msgToSend[consts.MESSAGE_QUEUES] = message[1][consts.MESSAGE_QUEUES];
            
            for(var i in listenersGCM){
                listenersGCM[i](msgToSend);
            }
        }else{
                console.error("Unknown message type: "+cmd+".");
        }
    }
    
    var subscribeClusterStatus = function(listener){
        listenersGCM.push(listener);
    }
    
    // "Statistic subscription"
    var subscribeQueueStatistics = function(queueName, listener){
        // TODO
        // request: "CMD", RoQConstant.BSON_CONFIG_GET_HOST_BY_QNAME
        // answer: dConfiguration
        // monitorStatServer = (String) dConfiguration.get(RoQConstant.BSON_STAT_MONITOR_HOST);
        // subscribe same way than in initGCM except monitorStatServer is a full URL
        
        var sockReq = zmq.socket('req');
        sockReq.connect("tcp://"+consts.CONFIG_SERVER);
        
        
        var msgReqSubscribe = createMessage(
            consts.BSON_CONFIG_GET_HOST_BY_QNAME,[
            createMessagePart(consts.MESSAGE_QName,queueName)
        ]);
        // send request for config
        sockReq.send(msgReqSubscribe);
        
        // get answer
        sockReq.on('message',function(){
            //var bsonDConf =             
            console.log("received dconf:",arguments);
            //socketQueueStats[queue] = sockSub;
        });
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
    
    var removeQueue = function(queueName,host){
        sendGCMrequest({ "CMD" : consts.CONFIG_REMOVE_QUEUE , "QName" : queueName, "Host" : host});
    }         
    var stopQueue = function(queueName,host){
        sendGCMrequest({ "CMD" : consts.CONFIG_STOP_QUEUE , "QName" : queueName, "Host" : host});
    }     
    var createQueue = function(queueName,host){
        sendGCMrequest({ "CMD" : consts.CONFIG_CREATE_QUEUE , "QName" : queueName, "Host" : host});
    } 
    
    var sendGCMrequest = function(request){
        var sock = zmq.socket('req');
        sock.connect("tcp://"+consts.GCM_SERVER_CMD);

        console.log("will send:",request);
        var msg = bsonParser.serialize(request);
        
        sock.send(msg);
        
        sock.on('message',function(){
                if(arguments[0]){
                    var answer = bsonParser.deserialize(arguments[0]);
                    if( 0 == answer.RESULT){
                        console.log("request sent successfully. Comment: "+answer.COMMENT);
                    }else{
                        console.log("failed to send request.");
                    }
                }else{
                    console.log("received empty answer.");
                }
                    
        });
    }
    
    
    init();
}
