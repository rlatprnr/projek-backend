'use strict';

import express from 'express';
import validateReq from 'express-validation';
import {authenticateIfAuth} from '../auth';
import * as validators from '../request-validators';

function router (app, logger) {
  function post (req, res, next) {
    const attrs = req.body.data.attributes;

    // some legacy devices fail to send a platform attribute
    if (attrs.registrationId.length === 64) {
      attrs.platform = 'ios';
    }

    app.models.PushDevice.findOrCreate({where: attrs}).then(function (result) {
      function respond () {
        res.status(204).end();
      }

      const record = result[0];
      const isNew = result[1];

      if (!isNew && record.unread > 0) {
        return record.update({unread: 0}).then(respond);
      } else {
        respond();
      }
    })

    .catch(next);
  }

  return express.Router()
    .post('/push_devices', validateReq(validators.pushDevices), authenticateIfAuth(), post);
}

export default router;
