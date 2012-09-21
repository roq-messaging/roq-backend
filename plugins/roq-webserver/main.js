var express = require('express');

module.exports = function setup(options, imports, register) {
    var app = express.createServer();

    app.get('*', function(req, res){
        res.send('Hello World');
    });

    app.listen(options.port,function(){
        register(null,{
            webserver:{}
        });
    });
}
