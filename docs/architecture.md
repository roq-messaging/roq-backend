RoQ Internal Architecture
=========================

The architecture used by roq-backend is based on 
[architect.js](https://github.com/c9/architect). 

Every component is a plug-in describing dependencies on other plug-ins. 
Here are the dependencies between these plug-ins:


    roq-cli  roq-web-api     roq-web-app
        \      /       \       /
         \    /         \     /
     roq-controller     roq-web-core
           |
           |
     roq-connector
 

Components
----------

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

The web management console. See [roq-webconsole's repository](https://github.com/roq-messaging/roq-web-console) for more information on the web console.
