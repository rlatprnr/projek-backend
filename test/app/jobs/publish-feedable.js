'use strict';

import _ from 'lodash';
import test from 'tape';
import logger from '../../util/logger';
import * as data from '../../util/fixtures';
import clearDB from '../../util/clear-db';
import job from '../../../lib/App/jobs/publish-feedable';

export default function jobs ({app}) {
  clearDB(app.db);

  test('Job: publishFeedable', {timeout: 500}, function (t) {
    app.models.Quote.create(data.quote()).then(function (feedable) {
      return job({modelName: feedable.Model.name, id: feedable.id}, app).then(function () {
        app.models.FeedItem.findAll({
          where: {
            feedable: feedable.Model.name,
            feedableId: feedable.id
          }
        }).then(function (results) {
          if (results.length === 1) {
            t.pass(`creates one FeedItem for ${feedable.Model.name} with id ${feedable.id}`);
          } else {
            t.fail(`expected one FeedItem to be created. Actual ${results.length}`);
          }

          t.end();
        });
      });
    })

    .catch(t.end);
  });

  test('Job: publishFeedable, invalid arguments', function (t) {
    t.throws(_.partial(job, {modelName: undefined, id: 1}, logger),
             /Error/,
             'Requires "data.modelName" value');

    t.throws(_.partial(job, {modelName: 'Quote', id: undefined}, logger),
             /Error/,
             'Requires "data.id" value');

    t.throws(_.partial(job, {modelName: 'Quote', id: 1}, undefined),
             /Error/,
             'Requires "app" argument');

    t.throws(_.partial(job, {modelName: 'NotAModel', id: 1}, logger),
             /Error/,
             'Requires "data.modelName" to be a valid model');

    t.end();
  });
}
