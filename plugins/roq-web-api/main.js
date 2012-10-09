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
    
    var isDefined = function(v){
		return (v != undefined) && !isNaN(v);
	}
    
    var sortList = function(list,sort){
		if(null == sort.property || null == sort.direction){
			log.trace("invalid sort object");
		}else{
			log.trace("valid sort object");
			var dir=1;
			if("ASC" == sort.direction)
				dir = -1;
			list.sort(function(a,b){
				log.trace("sort:",a,b);
				var ap = a[sort.property];
				var bp = b[sort.property];
				if(null != ap && null != bp){
					if(ap.toUpperCase() == bp.toUpperCase())
						return 0
					return dir*((ap.toUpperCase() < bp.toUpperCase())*2-1);
				}else if(null != ap){
					return dir;
				}else if(null != bp){
					return -1*dir;
				}else{
					return 0;
				}
			});
		}
		return list;
	}
    
    var formatList = function(list,page,start,limit,sort){
		var list;
		
		if(!list)
			return {"success":false};
			
		// if necessary, sort the results
		if(undefined != sort){
			sort = JSON.parse(sort);
			log.trace("sort ", sort);
			for(var i in sort){
				sortList(list,sort[i]);
			}
		}	
		// if we don't have start, try using page to deduce start
		if( !isDefined(start) && isDefined(page) && isDefined(limit)){
			start = (page-1)*limit;
		}
		
		// slice if it makes sense
		if(isDefined(start) && isDefined(limit) && start >=0 && limit >= 0){
			log.trace("return results "+start+" to "+(start+limit-1));
			list = list.slice(start,start+limit);
		}
		
		return {
				"success" : true,
				"results": list.length,
				"rows": list
			};
    }
    
    var getDefaultCallback = function(req,res){
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
                res.send(
					formatList(controller.listHosts(),
						parseInt(req.query.page),
						parseInt(req.query.start),
						parseInt(req.query.limit),
						req.query.sort));
            });
        });
        
        app.namespace('/queues',function(){
            
            app.get('/list',function(req,res){
                log.trace('list queues');
                res.send(formatList(controller.listQueues(),
						parseInt(req.query.page),
						parseInt(req.query.start),
						parseInt(req.query.limit),
						req.query.sort));
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


