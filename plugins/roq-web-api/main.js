
module.exports = function setup(options, imports, register) {

    // imports.web-api.consts.MESSAGE_HOSTS
    // imports.web-api.consts.MESSAGE_QUEUES
    var receiveClusterStatus = function(message){
        console.log("roq-web-api: received cluster status",message);
    }

    imports['roq-connector'].subscribeClusterStatus(receiveClusterStatus);
    
    //imports['roq-connector'].createQueue('testQ5','127.0.1.1');
    //imports['roq-connector'].stopQueue('testQ5');
    //imports['roq-connector'].removeQueue('testQ5');
    
    
    register();
}
