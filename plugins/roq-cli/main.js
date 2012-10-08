var program = require('commander');

module.exports = function setup(options, imports, register) {
    var logger = options.logger;
    var controller = imports['roq-controller'];
    
    var init = function(){
        startcli();
        register();
    }
    
    var prompt = function(prog){
        var result = null;
        
        prog.prompt('roq> ',function(result){
            logger.trace("Processing ["+result+"]");
            if( 0 <= ['quit','exit','x'].indexOf(result)){
                process.exit(0);
            }else{
                if( 0 <= ['help','usage','h'].indexOf(result)){
                    usage();
                }else{
                    var elements = result.split(' ');
                    var first = elements.shift();
                    var ok = false;
                    if('queue' == first || 'q' == first)
                        ok = handleQueue(elements);
                    else if('host' == first || 'h' == first)
                        ok = handleHost(elements);
                    if(!ok)
                        console.log("Unknown command.");
                }
                console.log('');
                prompt(prog);
            }
        });
    }
    
    var handleQueue = function(elems){
        
        if('list' == elems[0] || 'l' == elems[0]){
            var queues = controller.listQueues();
            if('undefined' == typeof(queues.length)){
                console.log("Error: unable to fetch queues.");
                return true;
            }
            console.log("\nThere are "+queues.length+" queues.");
            console.log("\tID\tNAME\tHOST\t\tSTATE");
            console.log("\t-------------------------------------");
            for(var i in queues)
                console.log("\t"+i+":\t"+queues[i].Name+"\t"+queues[i].Host+"\t"+queues[i].State);
            
        }else if('create' == elems[0] || 'c' == elems[0]){
            console.log("Adding queue "+elems[1]+" to host "+elems[2]);
            controller.createQueue(elems[1],elems[2]);
            
            
        }else if('remove' == elems[0] || 'r' == elems[0]){
            console.log("Removing queue "+elems[1]);
            controller.removeQueue(elems[1]);
            
        }else if('stop' == elems[0] || 'p' == elems[0]){
            console.log("Stopping queue "+elems[1]);
            controller.stopQueue(elems[1]);
            
        }else if('start' == elems[0] || 't' == elems[0]){
            console.log("Starting queue "+elems[1]);
            controller.startQueue(elems[1]);
            
        }else if('stats' == elems[0] || 's' == elems[0]){
            if('get' == elems[1] || 'g' == elems[1]){
                var data = controller.getQueueStats(elems[2]);
                console.log("\nStatistics for queue ["+elems[2]+"]");
                if(!data){
                    console.log("No stats. Are statistics enabled for this queue?");
                    return true;
                }
                if( data.stats && data.stats[0]){
                    console.log("\n\tQueue has "
                        +data.stats[0]['XChanges']+" exchanges, "
                        +data.stats[0]['Producers']+" producers and a "
                        +"throughtput of "+data.stats[0]['Throughput']+"."
                        );
                }
                
                if( data.exchangesList && data.exchangesList.length){
                    var exd;
                    console.log("\n\tTotProc\tProc\tTotThr\tThr\tProd\tMin\tName");
                    console.log("\t-------------------------------------------------------------------------");
                    for(var i in data.exchangesList){
                        exd = data.exchanges[data.exchangesList[i]]; 
                        if(!exd.length)
                            console.log("\t"+data.exchangesList[i]);
                        else
                            console.log(""
                                +"\t"+exd[0]['stats']['TotalProcessed']
                                +"\t"+exd[0]['stats']['Processed']
                                +"\t"+exd[0]['stats']['TotalThroughput']
                                +"\t"+exd[0]['stats']['Throughput']
                                +"\t"+exd[0]['stats']['Producers']
                                +"\t"+exd[0]['stats']['Minute']
                                +"\t"+data.exchangesList[i]
                                +"\n\tCPU: "+exd[0]['load']['CPU']
                                +"\tMEM: "+exd[0]['load']['MEMORY']
                                );
                    }
                }
                
            }else if('on' == elems[1] || 'o' == elems[1]){
                console.log("Enabling statistics for queue "+elems[2]);
                controller.enableQueueStats(elems[2],function(err){
					if(!err)
						console.log("\nStatistics enabled for queue "+elems[2]);
					else{
						console.log("Failed to enable queue stats for queue "+elems[2]);
						console.error("q s o "+elems[2]+" > ",err);
					}
					
				});
            }else{
                return false;
            }
        }else{
            return false;
        }
        return true;
    }
      
    var handleHost = function(elems){
        if('list' == elems[0] || 'l' == elems[0]){
            var hosts = controller.listHosts();
            if('undefined' == typeof(hosts.length)){
                console.log("Error: unable to fetch hosts.");
                return true;
            }
            console.log("\nThere are "+hosts.length+" hosts.");
            console.log("\tID\tHOST");
            console.log("\t-----------------");
            for(var i in hosts)
                console.log("\t"+i+":\t"+hosts[i]);
            return true;
        }
        return false;
    }
    
    var usage = function(){
        console.log("\nAvailable commands: "
                +"\nhost list                   (h l)"
                +"\nqueue list                  (q l)"
                +"\nqueue stats on [name]       (q s o)"
                +"\nqueue stats get [name]      (q s g)"
                +"\nqueue create [name] [host]  (q c)"
                +"\nqueue remove [name]         (q r)"
                +"\nqueue stop [name]           (q p)"
                +"\nqueue start [name]          (q t)"
                +"\nusage, help                 (h)"
                +"\nquit, exit                  (x)"
                );
    }
      
    var startcli = function(){
        program.version('0.0.1')
            .option('-u, --howto', 'How to use this cli.')
            .parse(process.argv);
            
        if(program.howto){
            console.log("Simply run the program without arguments.");
            usage();
        }else{
            prompt(program);
        }
        
    }
    
    // everything is loaded, we can call the constructor
    init();
}


