var express = require('express');
require('express-namespace');

/*
    format of returned objects
    {
        "success" : true/false
        "results": NUM
        "rows": []
    }
    
*/

module.exports = function setup(options, imports, register) {
    var log = options.logger;
    var appServer;
    var controller = imports['roq-controller'];
    
    var init = function(){
        startServer(appServer);
        register();
    }
        
    var startServer = function(app){
         app = express();         
         mapRoutes(app);
         
         app.get('*',function(req,res){res.send('RoQ Web API: Nothing here.');});
         
         // extJS first asks domain for access control rules
         app.options('*',function(req,res){
             res.set('Access-Control-Allow-Origin','*');
             res.set('Access-Control-Allow-Methods','POST, GET, OPTIONS');
             res.set('Access-Control-Allow-Headers','X-Requested-With');
             res.send();
         });
         
         app.listen(options.port || 3000);
    }
    
    var formatList = function(list){
        if(!list)
            return {"success":false};
        else
        return {
                    "success" : true,
                    "results": list.length,
                    "rows": list
                };
    }
    
    var mapRoutes = function(app){
        app.namespace('/hosts',function(){
            app.get('/list',function(req,res){
                log.trace('list hosts');
                res.send(controller.listHosts());
            });
        });
        
        app.namespace('/queues',function(){
            
            app.get('/list',function(req,res){
                log.trace('list queues');
                res.send(formatList(controller.listQueues()));
            });
            
            app.namespace('/:id',function(){
                
                app.get('/create/:host',function(req,res){
                    log.trace('create queue '+req.params.id);
                    controller.createQueue(req.params.id,req.params.host);
                    res.send("{result:'success'}");
                });
                
                app.get('/remove',function(req,res){
                    log.trace('remove queue'+req.params.id);
                    controller.removeQueue(req.params.id);
                    res.send("{result:'success'}");
                });
                
                app.get('/stop',function(req,res){
                    log.trace('stop queue'+req.params.id);
                    controller.stopQueue(req.params.id);
                    res.send("{result:'success'}");
                });
                
                app.get('/start',function(req,res){
                    log.trace('start queue'+req.params.id);
                    controller.startQueue(req.params.id);
                    res.send("{result:'success'}");
                });
                app.namespace('/stats',function(){
                    app.get('/enable',function(req,res){
                        log.trace('enable stats for queue '+req.params.id);
                        controller.enableQueueStats(req.params.id);
                        res.send("{result:'success'}");
                    });
                    app.get('/get',function(req,res){
                        log.trace('get stats for queue '+req.params.id);
                        res.send(controller.getQueueStats(req.params.id));
                    });
                });
            });
        });
    }

    // everything is loaded, we can call the constructor
    init();
}


