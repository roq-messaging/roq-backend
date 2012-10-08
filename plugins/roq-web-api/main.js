var express = require('express');
var path = require('path');
require('express-namespace');

module.exports = function setup(options, imports, register) {
    var log = options.logger;
    var appServer;
    var controller = imports['roq-controller'];
    
    var init = function(){
        startServer(    
            appServer,
            options.port || 3000,
            options.enableConsole
        );
        register();
    }
        
    var startServer = function(app,port,enableConsole){
         app = express();         
         
         // add cross-site requests headers
         app.all('*',function(req,res,next){
            res.set('Access-Control-Allow-Origin','*');
            res.set('Access-Control-Allow-Methods','POST, GET, OPTIONS');
            res.set('Access-Control-Allow-Headers','X-Requested-With');
            next();
         });
         
         // map API routes
         mapRoutes(app);
         
         // the web interface
         if(enableConsole)
            mapWebConsoleRoutes(app);
         
         // catch-all for 404s (incompatible with express.static)
         //app.get('*',function(req,res){res.send(404,'RoQ Web API: Nothing here.');});
         
         // empty response to OPTIONS
         app.options('*',function(req,res){res.send();});
         
         app.listen(port);
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
    
    var getDefaultCallback = function(res,req){
        return function(error){
            if(null == error)
                res.send({success:true});
            else
                res.send({success:false,error:error});
        };
    }
    
    var mapRoutes = function(app){
        app.namespace('/hosts',function(){
            app.get('/list',function(req,res){
                log.trace('list hosts');
                res.send(formatList(controller.listHosts()));
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
                    controller.createQueue(req.params.id,req.params.host,getDefaultCallback(req,res));
                });
                
                app.get('/remove',function(req,res){
                    log.trace('remove queue'+req.params.id);
                    controller.removeQueue(req.params.id,getDefaultCallback(req,res));
                });
                
                app.get('/stop',function(req,res){
                    log.trace('stop queue'+req.params.id);
                    controller.stopQueue(req.params.id,getDefaultCallback(req,res));
                });
                
                app.get('/start',function(req,res){
                    log.trace('start queue'+req.params.id);
                    controller.startQueue(req.params.id,getDefaultCallback(req,res));
                });
                app.namespace('/stats',function(){
                    app.get('/enable',function(req,res){
                        log.trace('enable stats for queue '+req.params.id);
                        controller.enableQueueStats(req.params.id,getDefaultCallback(req,res));
                    });
                    app.get('/get',function(req,res){
                        log.trace('get stats for queue '+req.params.id);
                        res.send(controller.getQueueStats(req.params.id));
                    });
                });
            });
        });
    }

    var mapWebConsoleRoutes = function(app){
		var theDir = path.join(__dirname,'../../roq-web-console/');
		log.trace("Serving static files of "+theDir);
        app.use('/',express.static(theDir));
        
    }
    
    // everything is loaded, we can call the constructor
    init();
}


