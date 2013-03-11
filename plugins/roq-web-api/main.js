require('express-namespace');
var listutils = require('./listutils');

module.exports = function setup(options, imports, register) {
    var log = options.logger;
    var controller = imports['roq-controller'];
    var web = imports['roq-web-core'];
    
    var init = function(){
		
        mapRoutes(web.getApp());
        
        if(options.showAPI)
			showAPI(web.getApp());
        
        register();
    }
        
    // Documenting method
    // shows all registered routes in this app
	var showAPI = function(app){
        var out="";
        for(var method in app.routes){
            var paths = '';
            for(var i in app.routes[method])
				if('*' != app.routes[method][i]['path'])
					paths += '  '+app.routes[method][i]['path']+'\n';
			if(paths)
				out += method+'\n'+paths;
        }
        
		log.trace("API routes registered:\n"+out);

	}
    

    // Utility method to generate callbacks
    var getDefaultCallback = function(req,res){
        return function(error){
            if(null == error)
                res.send({success:true});
            else
                res.send({success:false,error:error});
        };
    }
    
	
	// Main method - mapping routes to API calls
    var mapRoutes = function(app){
		
        app.namespace('/hosts',function(){
            app.get('/',function(req,res){
                log.trace('list hosts');
                res.send(
                    listutils.formatList(controller.listHosts(),
                        parseInt(req.query.page),
                        parseInt(req.query.start),
                        parseInt(req.query.limit),
                        req.query.sort));
            });
        });
        
        app.namespace('/queues',function(){
            
            app.get('/',function(req,res){
                log.trace('list queues');
                res.send(listutils.formatList(controller.listQueues(),
                        parseInt(req.query.page),
                        parseInt(req.query.start),
                        parseInt(req.query.limit),
                        req.query.sort));
            });
            
            app.post('/',function(req,res){
                //Get ID and HOST from JSON
                var id = req.body.Name;
                var host = req.body.Host;
                log.trace('create queue '+id+' on host '+host);
                controller.createQueue(id,host,getDefaultCallback(req,res));
            });
            
            app.namespace('/:id',function(){
				
                //Get on a queue returns full statistics for the queue.
                app.get('/',function(req,res){
                    log.trace('get stats for queue '+req.params.id);
                    res.send(controller.getQueueStats(req.params.id));
                });
                
                app.put('/',function(req,res){
                    log.trace('update queue '+req.params.id);
                    
                    // State: queue start/stop
                    if("undefined" != typeof(req.body.State)){
						if(req.body.State){
						  log.trace('start queue'+req.params.id);
						  controller.startQueue(req.params.id,getDefaultCallback(req,res));
						} else{
						  log.trace('stop queue'+req.params.id);
						  controller.stopQueue(req.params.id,getDefaultCallback(req,res));
						}
					}
					
					// Statistics: queue stats on/off
                    if("undefined" != typeof(req.body.statisticsEnabled) ){
						if(req.body.statisticsEnabled){
						  log.trace('enable stat for queue'+req.params.id);
						  controller.enableQueueStats(req.params.id,getDefaultCallback(req,res));
						}else{
						  log.trace('disable stat for queue'+req.params.id);
						  controller.disableQueueStats(req.params.id,getDefaultCallback(req,res));
						}   
					}        
                });
                
                app.delete('/',function(req,res){
                    log.trace('remove queue'+req.params.id);
                    controller.removeQueue(req.params.id,getDefaultCallback(req,res));
                });
        
			});
		});
        
    }

    // everything is loaded, we can call the constructor
    init();
}


