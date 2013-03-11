var express = require('express');

module.exports = function setup(options, imports, register) {
    var log = options.logger;
    var appServer;
    
    
    var init = function(){
        appServer = startServer(
            options.port || 3000
        );
        register(null,{
                    'roq-web-core': {
                        getApp: function(){ return appServer; }
                }});
    }
    
    var startServer = function(port,enableConsole){
         app = express();     
         
         //Parse request bodies
         app.use(express.bodyParser());    
         
         // add cross-site requests headers
         app.all('*',function(req,res,next){
            res.set('Access-Control-Allow-Origin','*');
            //Allow all verbs for RestFul API
            res.set('Access-Control-Allow-Methods','POST, GET, PUT, DELETE, OPTIONS');
            res.set('Access-Control-Allow-Headers','X-Requested-With, Content-Type');
            next();
         });
         
         // catch-all for 404s (incompatible with express.static)
         //app.get('*',function(req,res){res.send(404,'RoQ Web API: Nothing here.');});
         
         // empty response to OPTIONS
         app.options('*',function(req,res){res.send();});
         app.listen(port);
         return app;
    }
    
    var isDefined = function(v){
        return (v != undefined) && !isNaN(v);
    }
    
  
    
    // everything is loaded, we can call the constructor
    init();
}


