roq-backend
===========

Installing
----------

1. install RoQ and dependencies (this will install the necessary zeromq stuff)
2. Download the latest tarball from develop
3. extract it somewhere
4. install nodejs and npm (currently, v0.6 will do. On ubuntu, packages with the same name exist)
5. install dependencies. To do that, go into roq-backend folder and run: 
		
		npm install
		
6. fetch submodules. To do that, go into roq-backend folder and run:

		git submodule init
		git submodule update --recursive

Running
-------

Run the application using the launcher:
```
./launcher.js [web|cli]
```
### web
By choosing **web**, you get the web application (management console) and the APIs.

## cli 
By choosing **cli** you get the command-line interface. See below for a manual.


Test using:
```
npm test
```

Using the CLI
-------------

When running the CLI, you can get a list of available commands with `help`.

### Available commands: 

Where `[name]` is the name of the queue. 

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

    queue autoscaling create    (q as c [7])
    queue autoscaling describe  (q as d [1])

Example for `create`: 

    queue autoscaling create [queueName] [asName] [hostCPU] [hostRAM] [xchangeThr] [queueThrProd] [queueQProd]

### Misc.

    usage, help                 (h)
    quit, exit                  (x)



Web API Documentation
---------------------

TODO. 


Components
----------

Stack: 

    --------------
    | [cli/web]  |
    --------------
    | controller |
    --------------
    | connector  |
    --------------


### roq-connector

Implements the RoQ API by connecting to the zmq socket and discussing with RoQ's GCM.

### roq-controller

Caches status and statistics messages received from RoQ in order to offer a synchronous way to access the latest statistics and cluster status.

### roq-cli

Provides a command-line interface to access the management API. You can run it using:

### roq-web-core

Common dependency to the web-api and the web-app.

### roq-web-api

Provides a REST API to access the management API. 

### roq-web-app

The web console. See [roq-webconsole's repository](https://github.com/roq-messaging/roq-web-console) for more information on the web console.

