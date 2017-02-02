'use strict';

import express from 'express';
import serialize from '../serializers/update';
import validateReq from 'express-validation';
import {authenticateIfAuth} from '../auth';
import * as validators from '../request-validators';
import createError from 'http-errors';
import {extractRolesFromReq} from '../util';

function router (app, logger) {
  function all (req, res, next) {
    const page = req.query.page || {};
    const limit = parseInt((page.limit || 10), 10);
    const offset = parseInt((page.offset || 0), 10);

    const order = [
      ['createdAt', 'DESC']
    ];

    app.models.Update.findAll({order, limit, offset}).then(function (results) {
      res.json(serialize(results.map((u) => u.toJSON())));
    })

    .catch(next);
  }

  function one (req, res, next) {
    const id = req.params.id;

    app.models.Update.findById(id)
      .then(function (result) {
        if (!result) {
          throw createError(404, 'couldn\'t find Update', {id});
        }

        res.json(serialize(result.toJSON()));
      })

      .catch(next);
  }

  function post (req, res, next) {
    const attrs = req.body.data.attributes;

    app.models.Update.create(attrs).then(function (result) {
      return result.findAndSetRoles(extractRolesFromReq(req.body));
    }).then(function (result) {
      setImmediate(function () {
        app.worker.publish(app.worker.PUBLISH_FEEDABLE, {
          modelName: app.models.Update.name,
          id: result.id
        });
      });

      res.status(201).json(serialize(result.toJSON()));
    })

    .catch(next);
  }

  function patch (req, res, next) {
    const id = req.params.id;
    const attrs = req.body.data.attributes || {};

    app.models.Update.findById(id)
      .then(function (result) {
        if (!result) {
          throw createError(404, 'couldn\'t find Update', {id});
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

  function destroy (req, res, next) {
    app.models.Update.destroy({
      where: {
        id: req.params.id
      }
    })

    .then(function () {
      res.status(204).end();
    })

    .catch(next);
  }

  return express.Router()
    .get('/updates', validateReq(validators.getUpdates), authenticateIfAuth(), all)
    .get('/updates/:id', validateReq(validators.getItem), authenticateIfAuth(), one)
    .post('/updates', validateReq(validators.postUpdate), authenticateIfAuth(), post)
    .patch('/updates/:id', validateReq(validators.patchUpdate), authenticateIfAuth(), patch)
    .delete('/updates/:id', validateReq(validators.deleteObject), authenticateIfAuth(), destroy);
}

export default router;
