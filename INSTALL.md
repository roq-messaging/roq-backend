RoQ: backend - Installation procedure
=====================================

Install
-------

1. Install [RoQ and dependencies](https://github.com/roq-messaging/RoQ/blob/master/README.md)
(this will install the necessary zeromq stuff)
2. Download the [latest tarball from develop](https://github.com/roq-messaging/roq-backend/archive/develop.tar.gz)
3. extract it somewhere
4. install nodejs and npm (currently, v0.6 will do)
5. install dependencies. To do that, go into roq-backend folder and run: 
		
		npm install
		
6. fetch submodules. To do that, go into roq-backend folder and run:

		git submodule init
		git submodule update --recursive
      
Testing
-------

Note: the test are not up to date. They should be entirely rewritten.
  
Test using:

    npm test
