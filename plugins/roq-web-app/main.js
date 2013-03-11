var express = require('express');
var path = require('path');

module.exports = function setup(options, imports, register) {
    var log = options.logger;
    var web = imports['roq-web-core'];
    
    var init = function(){
		
        mapRoutes(web.getApp());
        
        register();
    }


    var mapRoutes = function(app){
        var theDir = path.join(__dirname,'../../roq-web-console/');
        log.trace("Serving static files of "+theDir);
        app.use('/',express.static(theDir));
        
    }
    
    
    init();
}
