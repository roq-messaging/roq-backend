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
            if( 0 < ['quit','exit'].indexOf(result)){
                process.exit(0);
            }else{
                var elements = result.split(' ');
                var first = elements.shift();
                var ok = false;
                if('queue' == first || 'q' == first)
                    ok = handleQueue(elements);
                else if('host' == first || 'h' == first)
                    ok = handleHost(elements);
                
                if(!ok)
                    console.log("Unknown command");
                prompt(prog);
            }
        });
    }
    
    var handleQueue = function(elems){
        if('list' == elems[0] || 'l' == elems[0]){
            console.log("list of queues");
            return true;
        }
        return false;
    }
      
    var handleHost = function(elems){
        if('list' == elems[0] || 'l' == elems[0]){
            console.log("list of hosts");
            return true;
        }
        return false;
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


