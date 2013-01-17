#!/usr/bin/env node

// requires
var launchHelper = require("./launcher.helper");

var LAUNCH_LIST = ['webserver','web-api','cli','orchestrator']; 
var DEFAULT_APP_CONFIG = 'cli';

var init = function(){
    var config = getConfig(process.argv[2]);
    launchHelper.run(config);
}

var getConfig = function(arg){
    if( 0 <= LAUNCH_LIST.indexOf(arg) )
        return arg;
    return DEFAULT_APP_CONFIG;
}




    
// run
init();
