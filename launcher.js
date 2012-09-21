#!/usr/bin/env node

var path = require('path');
var architect = require("architect");
var config = 'orchestrator';
var configPath;

if( 'webserver' == process.argv[2] || 'orchestrator' == process.argv[2] || 'web-api' == process.argv[2]  )
    config = process.argv[2];

var configPath = path.resolve("./config."+config+".js");

architect.createApp(architect.loadConfig(configPath), function (err, app) {
    if (err) {
        console.error("While starting the '%s':", configPath);
        throw err;
    }
    console.log("Started '%s'!", configPath);
});
