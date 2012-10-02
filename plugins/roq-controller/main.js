
module.exports = function setup(options, imports, register) {
    var connector = imports['roq-connector'];
    var log = options.logger;
    var database;
    
    var init = function(){  
        log.trace("starting controller"); 
        connectRoq(options.mgmtControllerAddress);
        register(null,{
                'roq-controller': {
                    listQueues: listQueues,
                    listHosts: listHosts,
                    createQueue: createQueue,
                    removeQueue: removeQueue,
                    startQueue: startQueue,
                    stopQueue: stopQueue,
                    getQueueStats: getQueueStats,
                    enableQueueStats: enableQueueStats,
                }
        });
    }
    
    var connectRoq = function(mgmtControllerAddress){
        log.trace("connect and subscribe");
        connector.connect(mgmtControllerAddress);
        connector.subscribeClusterStatus(receiveClusterStatus);
    }
    
    // **** cluster status  ****    
    
    var counter = 1;
    var receiveClusterStatus = function(message){
        if( 0 == (counter++) % 10 )
            log.trace("received 10 cluster statuses.");
        database.updateClusterConfig(message['Hosts'],message['Queues']);
    }    
    
    var listQueues = function(){
        log.trace("List queues");
        return database.getQueues();
    }
    
    var listHosts = function(){
        log.trace("List hosts");
        return database.getHosts();
    }
    
    // **** queue operations ****
    
    var createQueue = function(queueName,host,callback){
        connector.createQueue(queueName,host,callback);
    }
    
    var removeQueue = function(queueName,callback){
        connector.removeQueue(queueName,callback);
    }
    
    var startQueue = function(queueName,callback){
        connector.startQueue(queueName,callback);
    }
    
    var stopQueue = function(queueName,callback){
        connector.stopQueue(queueName,callback);
    }
    
    // **** queue statistics ****
    
    var enableQueueStats = function(queueName,callback){
        if(database.hasQueueStats(queueName))
            return;
            
        database.enableQueueStats(queueName);
        
        connector.subscribeQueueStatistics(queueName,function(err,data){
           if(null != err){
                log.error("failed to subscribe to queue statistics",err);
                callback(err);
           }else{
                log.trace("queue statistics"); 
                log.trace(data);
                database.updateQueueStatistics(queueName,data);
                callback(null);
           }
        });   
    }
    
    var getQueueStats = function(queueName){
        if(database.hasQueueStats(queueName))
            return database.getQueueStats(queueName);
        else
            return null;
    }

    // **** in-memory cache of stats & infos ****
    
    var database = (function(){
        var clusterConfig = {hosts:[],queues:[]};
        var queueStatistics = {};
        
        var obj = {};
        
        obj.enableQueueStats = function(queue){
            if(!queueStatistics[queue])
                queueStatistics[queue] = { 
                    enabled:true,
                    data:{
                        exchangesList:[],
                        exchanges:{},
                        stats:[]
                        }
                    }
            else
                queueStatistics[queue].enabled = true;
        }
        
        obj.disableQueueStats = function(queue){
            if(queueStatistics[queue])
                queueStatistics[queue].enabled = false;
        }
        
        obj.updateQueueStatistics = function(queue, data){
            if(queueStatistics[queue]){
                if(data.exchange){
                    if(0 > queueStatistics[queue].data.exchangesList.indexOf(data.exchange.name)){
                        queueStatistics[queue].data.exchangesList.push(data.exchange.name);
                        queueStatistics[queue].data.exchanges[data.exchange.name] = [];
                    }
                    var lastStats = queueStatistics[queue].data.exchanges[data.exchange.name];
                    lastStats.unshift(data.exchange);
                    if(5 < lastStats.length)
                        lastStats.pop();
                }
                if(data.stats){
                    if(!queueStatistics[queue].data.stats)
                        queueStatistics[queue].data.stats = [];
                    queueStatistics[queue].data.stats.unshift(data.stats);
                     if(5 < queueStatistics[queue].data.stats)
                        queueStatistics[queue].data.stats.pop();
                }
            }
        }
        
        obj.updateClusterConfig = function(newHosts, newQueues){
            clusterConfig.hosts = newHosts;
            clusterConfig.queues = newQueues;
        }
        
        obj.getHosts = function(){
            return clusterConfig.hosts;
        }
        
        obj.getQueues = function(){
            return clusterConfig.queues;
        }
        
        obj.hasQueueStats = function(queue){
            return queueStatistics[queue] ? queueStatistics[queue].enabled : false;
        }
        
        obj.getQueueStats = function(queue){
            return queueStatistics[queue].data;
        }
        
        return obj;
        
    })();
    
    // everything is loaded, we can call the constructor
    init();
}
