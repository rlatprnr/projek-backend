'use strict';

import express from 'express';
import validateReq from 'express-validation';
import * as validators from '../request-validators';
import {authenticate, authorizeSameUser} from '../auth';
import serializeAgent from '../serializers/agents';
import createError from 'http-errors';

function router (app, logger) {
  function assertFound (result, id, model = 'Agent') {
    if (!result) {
      throw createError(404, `couldn't find ${model}`, {id});
    }
  }

  function loadAndAuthorize (req, res, next) {
    if (req.user.Agent && req.user.Agent.id.toString() === req.params.id) {
      req.agent = req.user.Agent;
      return next();
    }

    app.models.Agent.findById(req.params.id).then(function (result) {
      assertFound(result, req.params.id);

      req.agent = result;

      authorizeSameUser({
        compareTo: result.UserId
      })(req, res, next);
    })

    .catch(next);
  }

  function get (req, res, next) {
    res.status(200).json(serializeAgent(req.agent.toJSON()));
  }

  function patch (req, res, next) {
    const attrs = req.body.data.attributes || {};

    return req.agent.update(attrs).then(function (updated) {
      res.status(200).json(serializeAgent(updated.toJSON()));
    })

    .catch(next);
  }

  return express.Router()
    .get('/agents/:id', validateReq(validators.getAgent), authenticate(), loadAndAuthorize, get)
    .patch('/agents/:id', validateReq(validators.patchAgents), authenticate(), loadAndAuthorize, patch);
}

export default router;
