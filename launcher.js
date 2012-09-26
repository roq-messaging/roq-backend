#!/usr/bin/env node

// requires
var path = require('path');
var architect = require("architect");

// consts
var DEFAULT_APP_CONFIG = 'cli';
var DEFAULT_LOGGER_CONFIG = 'log4js.config.json';
var CLI_LOGGER_CONFIG = 'log4js.config.cli.json';

// apps we can launch
var LAUNCH_LIST = ['webserver','web-api','cli'];     //'orchestrator',?

// logging
var log4js = require('log4js');
var logger;

var init = function(){
    var config = getConfig(process.argv[2]);
    var logconf = ('cli' == config ? CLI_LOGGER_CONFIG : DEFAULT_LOGGER_CONFIG);
    
    log4js.configure(path.join(__dirname,logconf));
    logger = log4js.getLogger("roq.launcher");
    
    var appConf = architect.loadConfig(path.resolve("./config."+config+".js"));

    provideLogging(appConf);
    
    architect.createApp(appConf, function (err, app) {
        if (err) {
            logger.error("While starting the app '%s':", config);
            throw err;
        }
        logger.trace("Started '%s'!", config);
    });
}

// find out which app to run
var getConfig = function(arg){
    if( 0 <= LAUNCH_LIST.indexOf(arg) )
        return arg;
    return DEFAULT_APP_CONFIG;
}

// add a logging system
var provideLogging = function(appConf){
    for(var i in appConf){
        appConf[i].logger = log4js.getLogger(
                path.basename(path.dirname(appConf[i].packagePath))
        );
    }
}



    
// run
init();
