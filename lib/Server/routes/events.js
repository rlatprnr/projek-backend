'use strict';

import _ from 'lodash';
import express from 'express';
import Promise from 'bluebird';
import serialize from '../serializers/events';
import validateReq from 'express-validation';
import { authenticateIfAuth } from '../auth';
import * as validators from '../request-validators';
import createError from 'http-errors';
import {extractRolesFromReq} from '../util';
import request from 'superagent';

function router(app, logger) {

  function getEvent(req, res, next) {
    const id = req.params.id;
    const userIdCondition = req.user != null ? { userId: req.user.id } : {};

    Promise.all([
      app.models.Event.findOne({
        where: {
          id
        },
        include: [
          { all: true }
        ],
        associations: true
      }),
      app.models.EventAttendees.count({
        where: _.assignIn({
          eventId: id
        }, userIdCondition)
      })
    ])

    .spread(function(data, attendData) {
      if (!data) {
        res.json({ data: {} });
        return;
      }
      let obj = data.toJSON();
      obj.myAttendance = attendData != 0;
      res.json({
        data: serialize(obj).data
      });
    })

    .catch(next);
  }

  function getEvents(req, res, next) {
    const page = req.query.page || {};
    const limit = parseInt((page.limit || 10), 10);
    const offset = parseInt((page.offset || 0), 10);
    const order = [
      ['fromDate', 'DESC']
    ];
    const userIdCondition = req.user != null ? { userId: req.user.id } : {};

    app.models.Event.findAll({
      order,
      limit,
      offset,
      include: [
        { all: true }
      ]
    })

    .then(function(items) {
      return Promise.all([
        items,
        Promise.map(items, function(item) {
          return app.models.EventAttendees.count({
            where: _.assignIn({
              eventId: item.id
            }, userIdCondition)
          })
        })
      ]);
    })

    .spread(function(items, attendData) {
      return items.map(function(item, i) {
        if (!item) return;
        let obj = item.toJSON();
        obj.myAttendance = attendData[i] != 0;
        return serialize(obj).data;
      });
    })

    .then(function(eventList) {
      res.json({ data: _.compact(eventList) });
    })

    .catch(next);
  }

  function postEvents(req, res, next) {
    const attrs = req.body.data.attributes;

    app.models.Event.create(attrs).then(function(result) {
      console.log('---->', result);
      return result.findAndSetRoles(extractRolesFromReq(req.body));
    })

    .then(function(result) {
      setImmediate(function() {
        app.worker.publish(app.worker.PUBLISH_FEEDABLE, {
          modelName: app.models.Event.name,
          id: result.id
        });
      });

      res.status(201).json(serialize(result.toJSON()));
    })

    .catch(next);
  }

  function patchEvent(req, res, next) {
    const id = req.params.id;
    const attrs = req.body.data.attributes || {};

    app.models.Event.findById(id).then(function(result) {
      if (!result) {
        throw createError(404, 'couldn\'t find Event', { id });
      }

      return result.update(attrs);
    })

    .then(function(result) {
      return result.findAndSetRoles(extractRolesFromReq(req.body));
    })

    .then(function(updated) {
      res.json(serialize(updated.toJSON()));
    })

    .catch(next);
  }

  function deleteEvent(req, res, next) {
    app.models.Event.destroy({
      where: {
        id: req.params.id
      }
    })

    .then(function() {
      res.status(204).end();
    })

    .catch(next);
  }

  function downloadEventRegistrationForm(req, res, next) {
    const id = req.params.id;
    const userIdCondition = req.user != null ? { userId: req.user.id } : {};

    app.models.Event.findOne({
      where: { id },
      include: [{ all: true }],
      associations: true
    })

    .then(function(data){
      res.header("Content-Type",'text/html');
      if (data.registrationFormUrl == null) {
        res.send("");
      }
      request.get(data.registrationFormUrl)
        .end(function(err, response) {
          res.send(response.text);
        });
    });
  }

  return express.Router()
    .get('/events/:id', validateReq(validators.getEvent), authenticateIfAuth(), getEvent)
    .get('/events', validateReq(validators.getEvents), authenticateIfAuth(), getEvents)
    .post('/events', validateReq(validators.postEvents), authenticateIfAuth(), postEvents)
    .patch('/events/:id', validateReq(validators.patchEvent), authenticateIfAuth(), patchEvent)
    .delete('/quotes/:id', validateReq(validators.deleteObject), authenticateIfAuth(), deleteEvent)
    .get('/event/registrationForm/:id', validateReq(validators.downloadEventRegistrationForm), authenticateIfAuth(), downloadEventRegistrationForm);
}

export default router;
