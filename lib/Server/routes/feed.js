'use strict';

import _ from 'lodash';
import express from 'express';
import serializeEvents from '../serializers/events';
import serializeNews from '../serializers/news';
import serializeUpdates from '../serializers/update';
import serializeQuotes from '../serializers/quotes';
import validateReq from 'express-validation';
import {authenticateIfAuth} from '../auth';
import * as validators from '../request-validators';
import Promise from 'bluebird';

function router (app, logger) {
  function get (req, res, next) {
    const page = req.query.page || {};
    const limit = parseInt((page.limit || 10), 10);
    const offset = parseInt((page.offset || 0), 10);

    const order = [
      ['createdAt', 'DESC']
    ];

    app.models.FeedItem.findAll({
      order,
      limit,
      offset,
      include: [
        {all: true}
      ]
    })

    .then(function (items) {
      return items.map(function (item) {
        let feedable = item[item.feedable];
        if (!feedable) { return null; }
        let obj = feedable.toJSON();
        return serializeFeedItem(feedable.Model.name, obj);
      });
    })

    .then(function (feedList) {
      res.json({data: _.compact(feedList)});
    })

    .catch(next);
  }

  function getSummary(req, res, next) {
    Promise.all([
      getLatestProject(),
      getLatestFeedItems()
    ])
    
    .spread(function(projectItem, feedItems) {
      var summaryList = _.concat(projectItem, feedItems);
      res.json({ data: _.compact(summaryList) });
    })

    .catch(next);
  }

  function getLatestProject() {
    return app.models.Project.max('Project.id')
      .then(function(projectId) {
        return { type: 'projects', id: projectId.toString() };
      });
  }

  function getLatestFeedItems() {
    const order = [
      ['createdAt', 'DESC']
    ];

    return app.models.FeedItem.findAll({
      attributes: ['feedable', ['max(feedableId)', 'id']],
      where: {
        'feedable': {
          $notLike: 'Quote'
        }
      },
      group: 'feedable',
      order: order
    })
    .then(function(items) {
      return items.map(function(item) {
        let obj = item.toJSON();
        return serializeFeedItem(obj.feedable, obj);
      });
    });
  }

  function serializeFeedItem(name, obj) {
    switch (name) {
      case 'NewsArticle':
        return serializeNews(obj).data;
      case 'Update':
        return serializeUpdates(obj).data;
      case 'Quote':
        return serializeQuotes(obj).data;
      case 'Event':
        return serializeEvents(obj).data;
    }
    return null;
  }

  return express.Router()
    .get('/feed', validateReq(validators.getFeed), authenticateIfAuth(), get)
    .get('/feed/summary', validateReq(validators.getFeedSummary), authenticateIfAuth(), getSummary);
}

export default router;
