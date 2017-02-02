'use strict';

import _ from 'lodash';
import express from 'express';
import Promise from 'bluebird';
import serializeAds from '../serializers/ads';
import validateReq from 'express-validation';
import { authenticateIfAuth } from '../auth';
import * as validators from '../request-validators';

function router(app, logger) {

  function getAds(req, res, next) {
    const page = req.query.page || {};
    const limit = parseInt((page.limit || 10), 10);
    const offset = parseInt((page.offset || 0), 10);
    const order = [
      ['createdAt', 'DESC']
    ];

    app.models.Ad.findAll({
      order,
      limit,
      offset,
      include: [
        { all: true }
      ]
    })

    .then(function(results) {
      res.json(
        serializeAds(results.map((r) => r.toJSON()))
      );
    })

    .catch(next);
  }

  return express.Router()
    .get('/ads', validateReq(validators.getAds), authenticateIfAuth(), getAds);
}

export default router;
