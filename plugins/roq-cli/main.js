var program = require('commander');

module.exports = function setup(options, imports, register) {
    var logger = options.logger;
    var orchestrator = imports['roq-orchestrator'];
    
    var init = function(){
        startcli();
        register();
    }
    
    var prompt = function(prog){
        var result = null;
        
        prog.prompt('roq> ',function(result){
            logger.trace("Processing ["+result+"]");
            prompt(prog);
        });
    }
      
    var startcli = function(){
        program.version('0.0.1')
            .option('-u, --howto', 'How to use this cli.')
            .parse(process.argv);
            
        if(program.howto){
            console.log("Simply run the program without arguments. Available commands:");
            console.log("host list, queue list, "
                +"\nqueue add [host] [name], queue rem [name], "
                +"\nqueue stop [name], queue start [name], "
                +"\nqueue stats [name]."
                );
        }else{
            prompt(program);
        }
        
    }
    
    // everything is loaded, we can call the constructor
    init();
}


