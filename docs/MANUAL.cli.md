Manual for RoQ CLI
==================

The command-line interface is launched with this command: 

    ./launcher.js cli

When running the CLI, you can get a list of available commands with `help`.

### Available commands

Where `[name]` is the name of the queue. All commands can be written full
text or abbreviated. For example, the following are equivalent:

    roq> queue stats on myQueue

    roq> q s o myQueue
    

#### Listing
    
    host list                   (h l)
    queue list                  (q l)

#### Stats

Stats have to be activated before you can actually get them. 
    
    queue stats on  [name]      (q s o)
    queue stats off [name]      (q s f)
    queue stats get [name]      (q s g)

#### Queue manipulation
    
    queue create [name] [host]  (q c)
    queue remove [name]         (q r)
    queue stop [name]           (q p)
    queue start [name]          (q t)

#### Queue autoscaling    

    queue autoscaling create [name]    (q as c)
    queue autoscaling describe [name]  (q as d)

The create command takes 7 additionnal arguments:

    queue autoscaling create [queueName] [asName] [hostCPU] [hostRAM] [xchangeThr] [queueThrProd] [queueQProd]

### Misc.

    usage, help                 (h)
    quit, exit                  (x)

