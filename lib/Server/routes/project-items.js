'use strict';

import express from 'express';
import serialize from '../serializers/project-items';
import validateReq from 'express-validation';
import {authenticateIfAuth} from '../auth';
import * as validators from '../request-validators';
import createError from 'http-errors';
import {extractRolesFromReq} from '../util';

function router (app, logger) {
  function one (req, res, next) {
    const id = req.params.id;

    app.models.ProjectItem.findById(id)
      .then(function (result) {
        if (!result) {
          throw createError(404, 'couldn\'t find ProjectItem', {id});
        }

        res.json(serialize(result.toJSON()));
      })

      .catch(next);
  }

  function patch (req, res, next) {
    const id = req.params.id;
    const attrs = req.body.data.attributes || {};

    app.models.ProjectItem.findById(id).then(function (result) {
      if (!result) {
        throw createError(404, 'couldn\'t find ProjectItem', {id});
      }

      return result.update(attrs);
    })

    .then(function (result) {
      return result.findAndSetRoles(extractRolesFromReq(req.body));
    })

    .then(function (updated) {
      res.json(serialize(updated.toJSON()));
    })

    .catch(next);
  }

  return express.Router()
    .get('/project-items/:id', validateReq(validators.getItem), authenticateIfAuth(), one)
    .patch('/project-items/:id', validateReq(validators.patchProjectItem), authenticateIfAuth(), patch);
}

export default router;
