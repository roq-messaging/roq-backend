

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

The web management console. See [roq-webconsole's repository](https://github.com/roq-messaging/roq-web-console) for more information on the web console.
