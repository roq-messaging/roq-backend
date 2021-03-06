
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
                    autoscalingCreateRule:autoscalingCreateRule,
                    autoscalingDescribeRule: autoscalingDescribeRule,
                    getQueueStats: getQueueStats,
                    enableQueueStats: enableQueueStats,
                    disableQueueStats: disableQueueStats,
                }
        });
    }
    
    var connectRoq = function(mgmtControllerAddress){
        log.trace("connect and subscribe");
        connector.connect(mgmtControllerAddress);
        connector.subscribeClusterStatus(receiveClusterStatus);
    }
    
    // **** cluster status  ****    
    
    var counterClusterStatus = 1;
    var receiveClusterStatus = function(message){
        if( 0 == (counterClusterStatus++) % 10 )
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
    
    var autoscalingDescribeRule = function(queueName,callback){
        connector.autoscalingDescribeRule(queueName,callback);
    }
    
    var autoscalingCreateRule = function(queueName,
            asName,hostCPU,hostRAM,
            xchangeThr,queueThrProd,queueQProd,
            callback){
        connector.autoscalingCreateRule(queueName,
            asName,hostCPU,hostRAM,
            xchangeThr,queueThrProd,queueQProd,
            callback);
    }
    
    // **** queue statistics ****
    var disableQueueStats = function(queueName,callback){
		listener = database.getQueueStatsListener(queueName);
		
		connector.unsubscribeQueueStatistics(queueName,listener,function(err){
            if(null != err){
                log.error("failed to unsubscribe from queue statistics",err);
                callback(err);
           }else{
			   database.disableQueueStats(queueName);
               callback(null);
           }
        });
	}
	
    var enableQueueStats = function(queueName,callback){
        if('function' != typeof(callback))
            callback = function(){}
            
        if(database.hasQueueStats(queueName))
            return callback(null);
                    
        var counterQueueStatistics=0;
        connector.subscribeQueueStatistics(queueName,function(err,listener){
            if(null != err){
                log.error("failed to subscribe to queue statistics",err);
                callback(err);
           }else{
			   database.enableQueueStats(queueName,listener);
               callback(null);
           }
        },function(err,data){
           if(null != err){
                log.error("listener received error message",err);
           }else{
                if( 0 == (counterQueueStatistics++) % 10 )
                    log.trace("received 10 queue stats for "+queueName); 
                database.updateQueueStatistics(queueName,data);
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
        
        obj.enableQueueStats = function(queue,listr){
            if(!queueStatistics[queue])
                queueStatistics[queue] = { 
                    enabled:true,
                    listener:listr,
                    data:{
                        exchangesList:[],
                        exchanges:{},
                        stats:[]
                        }
                    }
            else
                queueStatistics[queue].enabled = true;
        }
        
        obj.getQueueStatsListener = function(queue){
            if(queueStatistics[queue]){
                return queueStatistics[queue].listener;
			}
			return null;
        }
        
        obj.disableQueueStats = function(queue){
            if(queueStatistics[queue]){
                queueStatistics[queue].enabled = false;
			}
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
			
			// add infos on queue statistics
			for(var i in clusterConfig.queues)
				try{
					clusterConfig.queues[i].statisticsEnabled = this.hasQueueStats(clusterConfig.queues[i]["Name"]);
				}catch(TypeError){} // if we don't have any info yet on queue statistics for that queue
			
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
