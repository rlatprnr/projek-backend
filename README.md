# Project Asia Json Api

## About

* A nodejs http api serving content, user accounts, and mobile device management tools to mobile devices and an internal admin.
* Endpoints currently follow the [jsonapi.org](http://jsonapi.org/) specification. In some cases it breaks this convention, such as for error responses.
* The architecture is broken in to three main sections:
    * Server
        * A node process responsible for receiving and responding to http requests.
    * Worker
        * A node process responsible for handling background and resource heavy tasks queued most often via business logic within a server request/response cycle.
    * App
        * Manages a connection to a local MySQL database and provides and interface to it's data.
        * Manages a connection to a local RabbitMQ message queue which is used for notifying the worker of new jobs.
        * Manages a connection to a local redis server which currently stores and serves the index.html content of the admin app.
        * Manages connections to apns and gcm services for push notifications.
        * The Server and Worker both require the app and start an instance of it in order to concurrently operate and communicate with the app functionality.

## External Dependencies

* Node 5.4.0 (specified in .nvmrc)
* MySQL server
* RabbitMQ server
* Redis server

## Install

* If you use `nvm`, run `nvm use ; nvm install` to ensure you are running the required node verison for the project.
* `npm install`
* The db config is expected to be located at `./lib/App/db.json`. You can start with the example at `./lib/App/db.example.json`. One you have your config in place, make sure you create both the test and dev databases in your mysql server.
* `npm run sequelize -- db:migrate` and be sure to run it again with `NODE_ENV=test` in order to be able to run the tests.

## Commands

* `npm start`
  * Starts a local server on port `3000` and restarts on file changes.
  * Starts both the server and worker.
* `npm run start-www`
  * Starts only the local server.
* `npm run start-www-debug`
  * Starts the local server with [iron-node](https://github.com/s-a/iron-node)
* `npm run start-worker`
  * Starts only the local worker
* `npm run start-worker-debug`
  * Starts the local worker with [iron-node](https://github.com/s-a/iron-node)
* `npm run tail`
  * Tails all log output. Use this along with one of the "start" commands.
* `npm test`
* `npm run lint`
  * Uses [standard](https://github.com/feross/standard)

## Tests
  * Tests are written with [Tape](https://github.com/substack/tape)
  * `npm test`

## Issues
* Config service keys should not be persisted in plain text in `.env` and `.env.production`. This is very dangerous and was only done due to deadline pressures.
* Http logging and app logging is ok, but could use some improvements.
