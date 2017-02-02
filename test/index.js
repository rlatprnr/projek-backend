'use strict';

import '../lib/load-env';

import test from 'tape';
import nock from 'nock';
import logger from './util/logger';
import proxyquire from 'proxyquire';
import jackrabbit from './util/jackrabbit';
import apiTest from './api';
import appTest from './app';

const apn = {
  Connection () {
    return {
      pushNotification () {},
      on () { return this; },
      once () { return this; }
    };
  }
};

const Worker = proxyquire('../lib/App/worker', {
  jackrabbit
});

const App = proxyquire('../lib/App/', {
  apn,
  './worker': Worker
}).default;

nock.disableNetConnect();
nock.enableNetConnect('127.0.0.1');

const before = test;
const after = test;

const app = App({logger});

before('before: connect', function (t) {
  app.once('ready', t.end);
});

apiTest({app});
appTest({app});

after('after: disconnect', function (t) {
  t.end();
  process.exit();
});

