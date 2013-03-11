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




Web API Documentation
---------------------



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

