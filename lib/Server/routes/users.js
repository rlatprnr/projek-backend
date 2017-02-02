'use strict';

import {assign} from 'lodash';
import express from 'express';
import validateReq from 'express-validation';
import * as validators from '../request-validators';
import {authenticate, authorizeSameUser} from '../auth';
import serializeVerification from '../serializers/verifications';
import serializeAgent from '../serializers/agents';
import serializeUser from '../serializers/user';
import createError from 'http-errors';

function router (app, logger) {
  function me (req, res, next) {
    res.json(serializeUser(req.user.toJSON()));
  }

  function post (req, res, next) {
    const attrs = req.body.data.attributes;

    app.models.User.create(attrs).then(function (result) {
      app.models.UserVerification.create({
        UserId: result.id,
        label: 'phone'
      })

      .then(function (verification) {
        setImmediate(function () {
          app.worker.publish(app.worker.SEND_VERIFICATION, {id: verification.id});
        });

        res.status(201).json(serializeVerification(verification.toJSON()));
      });
    })

    .catch(next);
  }

  function postAgents (req, res, next) {
    if (req.user.Agent) {
      return next(createError(422, 'You are already an agent'));
    }

    const attrs = assign({}, req.body.data.attributes, {
      UserId: req.params.id
    });

    return app.models.Agent.create(attrs).then(function (agent) {
      return req.user.findAndAddRole(app.USER_AGENT_ROLE).then(function () {
        res.status(201).json(serializeAgent(agent.toJSON()));
      });
    })

    .catch(next);
  }

  return express.Router()
    .get('/me', validateReq(validators.getMe), authenticate(), me)
    .post('/users', validateReq(validators.postUsers), post)
    .post('/users/:id/agents', validateReq(validators.postAgents), authenticate(), authorizeSameUser(), postAgents);
}

export default router;
