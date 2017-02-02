'use strict';

import Promise from 'bluebird';
import express from 'express';
import auth from 'http-auth';
import path from 'path';
import {ADMIN_REDIS_KEY} from '../config';

const basicAuth = auth.basic({
  realm: 'projek-asia-api',
  file: path.join(__dirname, '../../../admin.htpasswd')
});

function router (app, logger) {
  function admin (req, res, next) {
    return Promise.resolve().then(function () {
      return app.redis.getAsync(`${ADMIN_REDIS_KEY}:current`);
    })

    .then(function (key) {
      return app.redis.getAsync(`${ADMIN_REDIS_KEY}:${key}`);
    })

    .then(function (html) {
      res.send(html);
    });
  }

  return express.Router()
    .get('/admin', auth.connect(basicAuth), admin);
}

export default router;
