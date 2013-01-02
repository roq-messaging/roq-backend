
// requires
var path = require('path');
var architect = require("architect");

// consts
var CONFIG_FOLDER = 'runconfigs';
var LOG4JS_FOLDER = 'log4js';
var DEFAULT_LOGGER_CONFIG = 'log4js.config.json';
var CLI_LOGGER_CONFIG = 'log4js.config.cli.json';

// logging
var log4js = require('log4js');
var logger;

exports.run = function(config){

    var logconf = ('cli' == config ? CLI_LOGGER_CONFIG : DEFAULT_LOGGER_CONFIG);
    
    log4js.configure(path.join(__dirname,LOG4JS_FOLDER,logconf));
    logger = log4js.getLogger("roq-launcher");
    
    var appConf = architect.loadConfig(path.resolve(CONFIG_FOLDER+"/config."+config+".js"));

    provideLogging(appConf);
    
    return architect.createApp(appConf, function (err, app) {
        if (err) {
            logger.error("While starting the app '%s':", config);
            throw err;
        }
        logger.trace("Started %s!", config);
    });
}

// add a logging system
var provideLogging = function(appConf){
    for(var i in appConf){
        appConf[i].logger = log4js.getLogger(
                path.basename(appConf[i].packagePath)
        );
    }
}


