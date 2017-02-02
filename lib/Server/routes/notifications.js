'use strict';

import express from 'express';
import validateReq from 'express-validation';
import {authenticateIfAuth} from '../auth';
import * as validators from '../request-validators';

function router (app, logger) {
  function post (req, res, next) {
    const attrs = req.body.data.attributes;

    setImmediate(function () {
      app.worker.publish(app.worker.PUSH_QUEUE, {
        type: attrs.contentType,
        id: attrs.contentId
      });
    });

    res.status(204).end();
  }

  return express.Router()
    .post('/notifications', validateReq(validators.notifications), authenticateIfAuth(), post);
}

export default router;
