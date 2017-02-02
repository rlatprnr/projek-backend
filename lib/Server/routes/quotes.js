'use strict';

import express from 'express';
import serialize from '../serializers/quotes';
import validateReq from 'express-validation';
import {authenticateIfAuth} from '../auth';
import * as validators from '../request-validators';
import createError from 'http-errors';
import {extractRolesFromReq} from '../util';

function router (app, logger) {
  function getQuotes (req, res, next) {
    const page = req.query.page || {};
    const limit = parseInt((page.limit || 10), 10);
    const offset = parseInt((page.offset || 0), 10);

    const order = [
      ['createdAt', 'DESC']
    ];

    app.models.Quote.findAll({
      order,
      limit,
      offset
    }).then(function (results) {
      res.json(
        serialize(results.map((r) => r.toJSON()))
      );
    })

    .catch(next);
  }

  function getQuote (req, res, next) {
    const id = req.params.id;

    app.models.Quote.findById(id)
      .then(function (result) {
        if (!result) {
          throw createError(404, 'couldn\'t find Quote', {id});
        }

        res.json(serialize(result.toJSON()));
      })

      .catch(next);
  }

  function postQuotes (req, res, next) {
    const attrs = req.body.data.attributes;

    app.models.Quote.create(attrs).then(function (result) {
      return result.findAndSetRoles(extractRolesFromReq(req.body));
    }).then(function (result) {
      setImmediate(function () {
        app.worker.publish(app.worker.PUBLISH_FEEDABLE, {
          modelName: app.models.Quote.name,
          id: result.id
        });
      });

      res.status(201).json(serialize(result.toJSON()));
    })

    .catch(next);
  }

  function patchQuote (req, res, next) {
    const id = req.params.id;
    const attrs = req.body.data.attributes || {};

    app.models.Quote.findById(id).then(function (result) {
      if (!result) {
        throw createError(404, 'couldn\'t find Quote', {id});
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

  function deleteQuote (req, res, next) {
    app.models.Quote.destroy({
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
    .get('/quotes', validateReq(validators.getQuotes), authenticateIfAuth(), getQuotes)
    .get('/quotes/:id', validateReq(validators.getItem), authenticateIfAuth(), getQuote)
    .post('/quotes', validateReq(validators.postQuotes), authenticateIfAuth(), postQuotes)
    .patch('/quotes/:id', validateReq(validators.patchQuote), authenticateIfAuth(), patchQuote)
    .delete('/quotes/:id', validateReq(validators.deleteObject), authenticateIfAuth(), deleteQuote);
}

export default router;
