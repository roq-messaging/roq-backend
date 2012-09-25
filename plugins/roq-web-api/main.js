
module.exports = function setup(options, imports, register) {

    // imports.web-api.consts.MESSAGE_HOSTS
    // imports.web-api.consts.MESSAGE_QUEUES
    var receiveClusterStatus = function(message){
        console.log("roq-web-api: received cluster status",message);
    }

    imports['roq-connector'].subscribeClusterStatus(receiveClusterStatus);
    
    //imports['roq-connector'].createQueue('testQ6',"172.24.112.161");
    //imports['roq-connector'].startQueue('testQ5');
    //imports['roq-connector'].removeQueue('testQ5');
    
    
    imports['roq-connector'].subscribeQueueStatistics('testQ6',function(err,exchangeId,exchangeStats,exchangeLoad){
       if(null != err){
            console.error("failed to get queue statistics",err);
       }else{
            console.log("queue statistics in web api!"); 
            console.log(exchangeId,exchangeStats,exchangeLoad);
       }
    });
    
    register();
}
