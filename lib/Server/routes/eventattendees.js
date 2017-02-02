'use strict';

import {capitalize} from 'lodash';
import express from 'express';
import validateReq from 'express-validation';
import { authenticateIfAuth } from '../auth';
import * as validators from '../request-validators';
// import serializeBearerToken from '../serializers/bearer-tokens';
import createError from 'http-errors';

function router (app, logger) {

  function get (req, res, next) {
    const eventId = req.params.id;
    const userId = req.user.id;

    app.models.EventAttendees.findOne({
      where:{
        eventId: eventId,
        userId: userId
      }
    })
    
    .then(function (attendee) {
      res.status(200).json({
        data: attendee
      });
    })

    .catch(next);
  }

  function put (req, res, next) {
    app.models.EventAttendees.create({
      eventId: req.body.data.eventId,
      userId: req.body.data.userId,
      registrationData: req.body.data.registrationData
    })
      .then(function (attendee) {
        if (!attendee) throw createError(404, 'couldn\'t create attend', req.body.data);
        res.status(200).json(attendee);
      })

      .catch(next);
  }

  function destroy (req, res, next) {
    app.models.EventAttendees.destroy({
      where:{
        eventId: req.body.data.eventId,
        userId: req.body.data.userId
      }
    })
      .then(function (attendee) {
        if (!attendee) throw createError(404, 'couldn\'t delete attend', req.body.data);
        res.status(200).json({
          data:{
            result: attendee
          }
        });
      })

      .catch(next);
  }

  return express.Router()
    .get('/attendEvent/:id', validateReq(validators.getAttendee), authenticateIfAuth(), get)
    .put('/attendEvent', validateReq(validators.putAttendee), put)
    .delete('/attendEvent', validateReq(validators.putAttendee), destroy);
}

export default router;
