roq-backend
===========

Installing
----------

1. install RoQ and dependencies (this will install the necessary zeromq stuff)
2. Download the latest tarball from develop
3. extract it somewhere
4. install nodejs and npm (currently, v0.6 will do. On ubuntu, packages with the same name exist)
5. install dependencies. To do that, go into roq-backend folder and run: ````npm install````
6. fetch submodules: ````git submodule init; git submodule update````
7. install extJS manually in roq-web-console/extjs

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
