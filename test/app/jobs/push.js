'use strict';

import {uniq, partial, every} from 'lodash';
import Promise from 'bluebird';
import test from 'tape';
import sinon from 'sinon';
import logger from '../../util/logger';
import proxyquire from 'proxyquire';
import * as data from '../../util/fixtures';
import clearDB from '../../util/clear-db';

const gcm = {
  Message (payload) { return payload; }
};

const pushJob = proxyquire('../../../lib/App/jobs/push', {
  'node-gcm': gcm
}).default;

export default function jobs ({app}) {
  function assertUnreadIncrement (t) {
    return app.models.PushDevice.findAll().then(function (results) {
      if (every(results, {unread: 1})) {
        t.pass('increments each push device unread count by 1');
      } else {
        t.fail(`expected each push device unread to be incremented by 1. Actual: ${uniq(results.map((r) => r.unread))}`);
      }
    });
  }

  clearDB(app.db);

  test('Job: push, type: news', {timeout: 500}, function (t) {
    t.plan(9);

    Promise.join(
      app.models.PushDevice.create(data.pushDevice({platform: 'android'})),
      app.models.PushDevice.create(data.pushDevice({platform: 'ios'})),
      app.models.NewsArticle.create(data.newsArticle()),
      function (androidDevice, iosDevice, newsArticle) {
        sinon.stub(app.gcmSender, 'send', function (msg, info, cb) {
          app.gcmSender.send.restore();

          t.deepEquals(msg.data.metadata,
                       {type: 'news', id: newsArticle.id},
                       'triggers gcm with correct metadata');

          t.equal(msg.data.title,
                       newsArticle.title,
                       'triggers gcm title of news article');

          t.deepEquals(msg.data.body,
                       newsArticle.summary,
                       'triggers gcm with body of news article');

          t.deepEqual(info.registrationTokens,
                      [androidDevice.registrationId],
                      'triggers gcm with android registrationIds');

          cb(null, info);
        });

        sinon.stub(app.apnConnection, 'pushNotification', function (data, token) {
          app.apnConnection.pushNotification.restore();

          t.deepEquals(data.payload.metadata,
                       {type: 'news', id: newsArticle.id},
                       'triggers apn with correct metadata');

          t.equal(data._alert,
                  newsArticle.title,
                  'triggers apn title of news article');

          t.equal(data._badge, 1, 'triggers apn with unread badge count');

          t.equal(token,
                  iosDevice.registrationId,
                  'triggers apn with ios registrationIds');
        });

        return pushJob({type: 'news', id: newsArticle.id}, app)
          .then(partial(assertUnreadIncrement, t));
      }
    )

    .catch(t.end);
  });

  clearDB(app.db);

  test('Job: push, type: project updates', {timeout: 500}, function (t) {
    t.plan(9);

    const projectAttrs = data.project();

    const updatePromise = app.models.Project.create(projectAttrs)
      .then(function (project) {
        const update = app.models.Update.build(data.update());
        update.setProject(project, {save: false});
        return update.save();
      });

    Promise.join(
      app.models.PushDevice.create(data.pushDevice({platform: 'android'})),
      app.models.PushDevice.create(data.pushDevice({platform: 'ios'})),
      updatePromise,
      function (androidDevice, iosDevice, update) {
        sinon.stub(app.gcmSender, 'send', function (msg, info, cb) {
          app.gcmSender.send.restore();

          t.deepEquals(msg.data.metadata,
                       {type: 'updates', id: update.id, projectId: update.ProjectId},
                       'triggers gcm with correct metadata');

          t.equal(msg.data.title,
                  `A new update for ${projectAttrs.title}`,
                  'triggers gcm with title of update project');

          t.deepEquals(msg.data.body,
                       update.summary,
                       'triggers gcm with summary of update');

          t.deepEqual(info.registrationTokens,
                      [androidDevice.registrationId],
                      'triggers gcm with android registrationIds');

          cb(null, info);
        });

        sinon.stub(app.apnConnection, 'pushNotification', function (data, token) {
          app.apnConnection.pushNotification.restore();

          t.deepEquals(data.payload.metadata,
                       {type: 'updates', id: update.id, projectId: update.ProjectId},
                       'triggers apn with correct metadata');

          t.equal(data._alert,
                       `A new update for ${projectAttrs.title}`,
                       'triggers apn with title of update project');

          t.equal(data._badge, 1, 'triggers apn with unread badge count');

          t.equal(token,
                  iosDevice.registrationId,
                  'triggers apn with ios registrationIds');
        });

        return pushJob({type: 'updates', id: update.id}, app)
          .then(partial(assertUnreadIncrement, t));
      }
    )

    .catch(t.end);
  });

  clearDB(app.db);

  test('Job: push, type: updates', {timeout: 500}, function (t) {
    t.plan(9);

    Promise.join(
      app.models.PushDevice.create(data.pushDevice({platform: 'android'})),
      app.models.PushDevice.create(data.pushDevice({platform: 'ios'})),
      app.models.Update.create(data.update()),
      function (androidDevice, iosDevice, update) {
        sinon.stub(app.gcmSender, 'send', function (msg, info, cb) {
          app.gcmSender.send.restore();

          t.deepEquals(msg.data.metadata,
                       {type: 'updates', id: update.id},
                       'triggers gcm with correct metadata');

          t.equal(msg.data.title,
                  'Update',
                  'triggers gcm with title of "Update"');

          t.deepEquals(msg.data.body,
                       update.summary,
                       'triggers gcm with body as summary of update');

          t.deepEqual(info.registrationTokens,
                      [androidDevice.registrationId],
                      'triggers gcm with android registrationIds');

          cb(null, info);
        });

        sinon.stub(app.apnConnection, 'pushNotification', function (data, token) {
          app.apnConnection.pushNotification.restore();

          t.deepEquals(data.payload.metadata,
                       {type: 'updates', id: update.id},
                       'triggers apn with correct metadata');

          t.equal(data._alert,
                  update.summary,
                  'triggers apn with title as summary of update');

          t.equal(data._badge, 1, 'triggers apn with unread badge count');

          t.equal(token,
                  iosDevice.registrationId,
                  'triggers apn with ios registrationIds');
        });

        return pushJob({type: 'updates', id: update.id}, app)
          .then(partial(assertUnreadIncrement, t));
      }
    )

    .catch(t.end);
  });

  clearDB(app.db);

  test('Job: push, type: quotes', {timeout: 500}, function (t) {
    t.plan(9);

    Promise.join(
      app.models.PushDevice.create(data.pushDevice({platform: 'android'})),
      app.models.PushDevice.create(data.pushDevice({platform: 'ios'})),
      app.models.Quote.create(data.quote()),
      function (androidDevice, iosDevice, quote) {
        sinon.stub(app.gcmSender, 'send', function (msg, info, cb) {
          app.gcmSender.send.restore();

          t.deepEquals(msg.data.metadata,
                       {type: 'quotes', id: quote.id},
                       'triggers gcm with correct metadata');

          t.equal(msg.data.title,
                  `New quote from ${quote.authorName}`,
                  'triggers gcm with author name in msg title');

          t.deepEquals(msg.data.body,
                       quote.quote,
                       'triggers gcm with quote text in msg body');

          t.deepEqual(info.registrationTokens,
                      [androidDevice.registrationId],
                      'triggers gcm with android registrationIds');

          cb(null, info);
        });

        sinon.stub(app.apnConnection, 'pushNotification', function (data, token) {
          app.apnConnection.pushNotification.restore();

          t.deepEquals(data.payload.metadata,
                       {type: 'quotes', id: quote.id},
                       'triggers apn with correct metadata');

          t.equal(data._alert,
                  `New quote from ${quote.authorName}`,
                  'triggers apn with author name in msg alert');

          t.equal(data._badge, 1, 'triggers apn with unread badge count');

          t.equal(token,
                  iosDevice.registrationId,
                  'triggers apn with ios registrationIds');
        });

        return pushJob({type: 'quotes', id: quote.id}, app)
          .then(partial(assertUnreadIncrement, t));
      }
    )

    .catch(t.end);
  });

  test('Job: push, missing input', function (t) {
    t.throws(partial(pushJob, {type: undefined, id: 1}, logger),
             /Error/,
             'Requires "data.type" value');

    t.throws(partial(pushJob, {type: 'news', id: undefined}, logger),
             /Error/,
             'Requires "data.id" value');

    t.throws(partial(pushJob, {type: 'news', id: 1}, undefined),
             /Error/,
             'Requires "app" argument');

    t.end();
  });
}
