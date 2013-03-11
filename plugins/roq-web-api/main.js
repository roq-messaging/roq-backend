require('express-namespace');

module.exports = function setup(options, imports, register) {
    var log = options.logger;
    var controller = imports['roq-controller'];
    var web = imports['roq-web-core'];
    
    var init = function(){
		
         mapRoutes(web.getApp());
        
        register();
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
                // this sort will fail for non-string elements.
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
        var totalLength = list.length;
        
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
        
        for(var i in list)
            list[i].ID = list[i].Name;
    
        return {
                "success" : true,
                "results": totalLength,
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
            app.get('/',function(req,res){
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
            
            app.get('/',function(req,res){
                log.trace('list queues');
                res.send(formatList(controller.listQueues(),
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
                
                //Get on a queue returns full statistics for the queue.
                app.get('/',function(req,res){
                    log.trace('get stats for queue '+req.params.id);
                        res.send(controller.getQueueStats(req.params.id));
                    });
                });
            });
        
    }

    // everything is loaded, we can call the constructor
    init();
}


