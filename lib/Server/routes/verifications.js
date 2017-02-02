'use strict';

import {capitalize} from 'lodash';
import express from 'express';
import validateReq from 'express-validation';
import * as validators from '../request-validators';
import serializeVerification from '../serializers/verifications';
import serializeBearerToken from '../serializers/bearer-tokens';
import {issueJwtBearer} from '../auth';
import createError from 'http-errors';

function router (app, logger) {
  function post (req, res, next) {
    const attrs = req.body.data.attributes;
    const finder = `findOneBy${capitalize(attrs.label)}`;

    app.models.User[finder](attrs.value).then(function (user) {
      if (!user) {
        throw createError(404, `couldn't find user by ${attrs.label} ${attrs.value}`, attrs);
      }

      return app.models.UserVerification.findOrCreate({
        where: {
          label: attrs.label,
          UserId: user.id
        }
      })

      .then(function (result) {
        const verification = result[0];
        return verification.update({verifiedAt: null}).then(function () {
          setImmediate(function () {
            app.worker.publish(app.worker.SEND_VERIFICATION, {id: verification.id});
          });

          res.status(201).json(serializeVerification(verification.toJSON()));
        });
      });
    })

    .catch(next);
  }

  function put (req, res, next) {
    app.models.UserVerification.findById(req.params.id).then(function (verification) {
      if (!verification) {
        throw createError(404, 'couldn\'t find verification', {id: req.params.id});
      }

      return verification.verify(req.body.data.attributes.token).return(verification)
        .catch(function () {
          throw createError(422, 'invalid token');
        });
    })

    .then(function (verification) {
      return issueJwtBearer(verification.UserId).then(function (jwt) {
        const payload = {
          id: jwt,
          expires: null
        };

        res.status(200).json(serializeBearerToken(payload));
      });
    })

    .catch(next);
  }

  return express.Router()
    .post('/verifications', validateReq(validators.postVerifications), post)
    .put('/verifications/:id', validateReq(validators.putVerifications), put);
}

export default router;
