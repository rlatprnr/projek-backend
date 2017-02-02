'use strict';

import express from 'express';
import serializeNews from '../serializers/news';
import validateReq from 'express-validation';
import {authenticateIfAuth} from '../auth';
import * as validators from '../request-validators';
import createError from 'http-errors';
import {extractRolesFromReq} from '../util';

function router (app, logger) {
  function getNews (req, res, next) {
    const page = req.query.page || {};
    const limit = parseInt((page.limit || 10), 10);
    const offset = parseInt((page.offset || 0), 10);

    const order = [
      ['createdAt', 'DESC']
    ];

    app.models.NewsArticle.findAll({
      order,
      limit,
      offset
    }).then(function (results) {
      res.json(
        serializeNews(results.map((r) => r.toJSON()))
      );
    })

    .catch(next);
  }

  function getNewsItem (req, res, next) {
    const id = req.params.id;

    app.models.NewsArticle.findById(id)
      .then(function (result) {
        if (!result) {
          throw createError(404, 'couldn\'t find NewsArticle', {id});
        }

        res.json(serializeNews(result.toJSON()));
      })

      .catch(next);
  }

  function postNews (req, res, next) {
    const attrs = req.body.data.attributes;

    app.models.NewsArticle.create(attrs).then(function (result) {
      return result.findAndSetRoles(extractRolesFromReq(req.body));
    }).then(function (result) {
      setImmediate(function () {
        app.worker.publish(app.worker.PUBLISH_FEEDABLE, {
          modelName: app.models.NewsArticle.name,
          id: result.id
        });
      });

      res.status(201).json(serializeNews(result.toJSON()));
    })

    .catch(next);
  }

  function patchNews (req, res, next) {
    const id = req.params.id;
    const attrs = req.body.data.attributes || {};

    app.models.NewsArticle.findById(id)
      .then(function (result) {
        if (!result) {
          throw createError(404, 'couldn\'t find NewsArticle', {id});
        }

        return result.update(attrs);
      })

      .then(function (result) {
        return result.findAndSetRoles(extractRolesFromReq(req.body));
      })

      .then(function (updated) {
        res.json(serializeNews(updated.toJSON()));
      })

      .catch(next);
  }

  function deleteNews (req, res, next) {
    app.models.NewsArticle.destroy({
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
    .get('/news', validateReq(validators.getNews), authenticateIfAuth(), getNews)
    .get('/news/:id', validateReq(validators.getItem), authenticateIfAuth(), getNewsItem)
    .post('/news', validateReq(validators.postNews), authenticateIfAuth(), postNews)
    .patch('/news/:id', validateReq(validators.patchNews), authenticateIfAuth(), patchNews)
    .delete('/news/:id', validateReq(validators.deleteObject), authenticateIfAuth(), deleteNews);
}

export default router;
