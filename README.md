roq-backend
===========

Installing
----------

1. install RoQ and dependencies (this will install the necessary zeromq stuff)
2. Download the latest tarball from develop
3. extract it somewhere
4. install nodejs (currently, v0.6 will do!)
5. install dependencies. To do that, go into roq-backend folder and run: ````npm install````

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
The "app" parameter can be: webserver, web-api or orchestrator.


Test using:
```
npm test
```
