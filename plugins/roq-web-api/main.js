var express = require('express');
require('express-namespace');

module.exports = function setup(options, imports, register) {

    var appServer;

    
    var init = function(){
        startServer(appServer);
        connectRoq();
        register();
    }
        
    var startServer = function(app){
         app = express();         
         mapRoutes(app);
         
         app.get('/.*/',function(req,res){res.send('Nothing here');});
         app.listen(options.port || 3000);
    }
    
    var mapRoutes = function(app){
        app.namespace('/hosts',function(){
            app.get('/list',function(req,res){
                res.send('host list');
            });
        });
        
        app.namespace('/queues',function(){
            
            app.get('/list',function(req,res){
                res.send('queues list');
            });
            
            app.namespace('/:id',function(){
                
                app.post('/add',function(req,res){
                    // req.params must also contain the host ID
                    res.send('add list '+req.params.id);
                });
                
                app.get('/remove',function(req,res){
                    res.send('remove list'+req.params.id);
                });
                
                app.get('/stop',function(req,res){
                    res.send('stop list'+req.params.id);
                });
                
                app.get('/start',function(req,res){
                    res.send('start list'+req.params.id);
                });
                
                app.get('/stats',function(req,res){
                    res.send('stats for list'+req.params.id);
                });
            });
        });
    }
    
    var connectRoq = function(){
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

    }
    
    // everything is loaded, we can call the constructor
    init();
}


