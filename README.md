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

Start orchestrator using:
```
npm start
```

Otherwise, use the launcher directly:
```
./launcher.js [app]
```
The "app" parameter can be: web-api, cli, webserver or orchestrator. Currently, the two first are the only ones implemented.


Test using:
```
npm test
```

Components
----------


### roq-connector

Implements the RoQ API by connecting to the zmq socket and discussing with RoQ's GCM.

### roq-controller

Caches status and statistics messages received from RoQ in order to offer a synchronous way to access the latest statistics and cluster status.

### roq-cli

Provides a command-line interface to access the management API. You can run it using:

```
./launcher.js cli
```

    --------------
    |    cli     |
    --------------
    | controller |
    --------------
    | connector  |
    --------------

### roq-web-api

Provides a REST API to access the management API. You can run it using:

```
./launcher.js web-api
```

    --------------
    |   web-api  |
    --------------
    | controller |
    --------------
    | connector  |
    --------------

### roq-webserver

Currently, the web console server is launched by the web-api plugin. To activate or deactivate the web console, just edit 

```
runconfigs/config.web-api.js 
```

and change "enableConsole" to false or true. See [roq-webconsole's repository](https://github.com/roq-messaging/roq-web-console) for more information on the web console.
