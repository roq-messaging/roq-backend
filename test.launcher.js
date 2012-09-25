#!/usr/bin/env node
//var process = require('process');
var path = require('path');
var architect = require("architect");
var config = 'testing';
var configPath;

var configPath = path.resolve("./config."+config+".js");

// this has to move in config
var hostManagerIP = "172.24.112.161";

// these are tests for roq-connector only
// TODO: find an elegant way to isolate each module's tests 
    
module.exports = {
    
    groupConnector1 : {    

        setUp: function(callback){
           buildApp(this,callback);
        },
        
        // clean up
        tearDown: function(callback){
            //console.dir(this);
            destroyApp(this,callback);
        },

        
        testCreateQueue: function(test){
            test.expect(2);
            var appRoqConnector = this.appRoqConnector;
            // we avoid trying to remove a non-existing queue: 
            // RoQ currently fails in this case.
            //appRoqConnector.removeQueue("CreateAQueue");
            appRoqConnector.createQueue("CreateAQueue",hostManagerIP,function(err){
                test.equals(err,null,"No error when creating queue");
                appRoqConnector.removeQueue("CreateAQueue",makeTestCallbackNoError(test,'queue operation'));
                test.done();
            });
        },
        
        testRemoveQueue: function(test){
            test.expect(1);
            this.appRoqConnector.createQueue("RemoveAQueue",hostManagerIP);
            this.appRoqConnector.removeQueue("RemoveAQueue",function(err){
                test.equals(err,null,"No error when removing queue");
                test.done();
            });
        },
        
        testStartQueue: function(test){
            test.expect(3);
            var appRoqConnector = this.appRoqConnector;
            appRoqConnector.createQueue("StartAQueue",hostManagerIP,makeTestCallbackNoError(test,'queue operation'));
            appRoqConnector.stopQueue("StartAQueue",makeTestCallbackNoError(test,'queue operation'));
            appRoqConnector.startQueue("StartAQueue",function(err){
                test.equals(err,null,"No error when starting queue");
                appRoqConnector.removeQueue("StartAQueue");
                test.done();
            });
        },
        
        
        testStopQueue: function(test){
            test.expect(2);
            var appRoqConnector = this.appRoqConnector;
            appRoqConnector.createQueue("StopAQueue",hostManagerIP,makeTestCallbackNoError(test,'queue operation'));
            appRoqConnector.stopQueue("StopAQueue",function(err){
                test.equals(err,null,"No error when starting queue");
                appRoqConnector.removeQueue("StopAQueue");
                test.done();
            });
        },
        
        
        testSubscribeClusterStatus: function(test){
            //console.log('testSubscribeClusterStatus');
            //console.dir(this);
            test.expect(3);
            this.appRoqConnector.subscribeClusterStatus(function(msg){
                test.equals(typeof(msg),'object',"Cluster status is an object");
                test.equals(typeof(msg['Hosts']),'object',"Cluster status has Hosts list.");
                test.equals(typeof(msg['Queues']),'object',"Cluster status has Queues list.");
                test.done();
            });
        },
    },
    
    groupConnector2 : {
            
        setUp: function(callback){
           buildApp(this,function(){
                this.appRoqConnector.createQueue("ExistingQueue",hostManagerIP);
                callback();
           });
        },
                
        // clean up
        tearDown: function(callback){
            if(this.appRoqConnector)
                this.appRoqConnector.removeQueue("ExistingQueue",hostManagerIP);
            destroyApp(this,callback);
        },
        
        testSubscribeQueueStatistics: function(test){
            test.expect(1);
            this.appRoqConnector.subscribeQueueStatistics("ExistingQueue",function(msg){
                test.equals(typeof(msg),'object',"Queue statistics is an object");
                test.done();
            });
        },
        
        testAutoSubscribeQueueStatistics: function(test){
            test.expect(1);
            //appRoqConnector.subscribeQueueStatistics("ExistingQueue",function(msg){
                test.ok(false,"Auto subscribe to queue statistics.");
                test.done();
            //});
        },
    }
}



var makeTestCallbackNoError = function(test,action){
    return function(err){
                test.ok(err,null,"No error on "+action+".");
    }
};

var buildApp = function(context,callback){
    context.application = architect.createApp(architect.loadConfig(configPath), function (err) {
        if (err) {
            console.error("While starting the '%s':", configPath);
            throw err;
        }
    });

    // also: 'service', 'plugin'
    context.application.on('ready',function(){ 
        context.appRoqConnector = context.application.services['roq-connector'];
        callback();
    });
}


var destroyApp = function(context,callback){
    try{
        context.application.services['roq-connector'].closeSockets();
        context.application.destroy();
    }catch(error){
        console.error("failed to destroy:",error);
    }  
    callback();
}
