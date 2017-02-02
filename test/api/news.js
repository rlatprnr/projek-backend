import _ from 'lodash';
import Promise from 'bluebird';
import test from 'tape';
import request from 'supertest';
import clearDB from '../util/clear-db';
import * as data from '../util/fixtures';
import sinon from 'sinon';

export default function news ({server, app}) {
  clearDB(app.db);

  function createNews (merge = {}) {
    return app.models.NewsArticle.create(
      data.newsArticle(merge)
    );
  }

  test('GET /news returns news descending', function (t) {
    const now = new Date();
    const future = new Date().setDate(now.getDate() + 1);

    return Promise.join(
      createNews({createdAt: now}),
      createNews({createdAt: future}),
      function (newsNow, newsFuture) {
        request(server)
          .get('/news')
          .accept('json')
          .expect(200)
          .end(function (err, res) {
            t.error(err, 'No error');
            t.equal(res.body.data.length, 2, 'returns all news');
            t.equal(res.body.data[0].id, newsFuture.id.toString(), 'orders news -createdAt');
            t.end();
          });
      });
  });

  clearDB(app.db);

  test('GET /news supports page queries', function (t) {
    const now = new Date();
    const future = new Date().setDate(now.getDate() + 1);

    return Promise.join(
      createNews({createdAt: now}),
      createNews({createdAt: future}),
      function (newsNow, newsFuture) {
        request(server)
          .get('/news')
          .accept('json')
          .query({page: {limit: 1, offset: 1}})
          .expect(200)
          .end(function (err, res) {
            t.error(err, 'No error');
            t.equal(res.body.data.length, 1, 'obeys page limit');
            t.equal(res.body.data[0].id, newsNow.id.toString(), 'obeys page offset');
            t.end();
          });
      });
  });

  clearDB(app.db);

  test('GET /news/:id returns requested item', function (t) {
    createNews().then(function (item) {
      request(server)
        .get(`/news/${item.id}`)
        .accept('json')
        .expect(200)
        .end(function (err, res) {
          t.error(err, 'No error');
          t.equal(res.body.data.id, item.id.toString(), 'returns news item');
          t.end();
        });
    });
  });

  clearDB(app.db);

  test('POST /news', function (t) {
    const spy = sinon.spy(app.worker, 'publish');

    request(server)
      .post('/news')
      .accept('json')
      .type('json')
      .send({
        data: {
          type: 'news',
          attributes: data.newsArticle()
        }
      })
      .expect(201)
      .end(function (err, res) {
        t.error(err, 'No error');
        t.equal(res.body.data.type, 'news', 'returns news item');

        app.models.NewsArticle.findAll().then(function (results) {
          if (results.length === 1) {
            t.pass('creates one news article');
          } else {
            t.fail(`expected one news article to be created. Actual ${results.length}`);
          }

          try {
            sinon.assert.calledWithMatch(spy, app.worker.PUBLISH_FEEDABLE, {
              modelName: 'NewsArticle',
              id: results[0].id
            });
            t.pass(`queues ${app.worker.PUBLISH_FEEDABLE} job`);
          } catch (e) {
            t.fail(e);
          } finally {
            app.worker.publish.restore();
            t.end();
          }
        });
      });
  });

  clearDB(app.db);

  test('PATCH /news/:id updates supplied attributes', function (t) {
    const originalAttrs = data.newsArticle();
    const updatedAttrs = _.pick(data.newsArticle(),
                                _.sample(_.keys(originalAttrs)));

    createNews(originalAttrs).then(function (item) {
      request(server)
        .patch(`/news/${item.id}`)
        .accept('json')
        .type('json')
        .send({
          data: {
            type: 'news',
            id: item.id,
            attributes: updatedAttrs
          }
        })
        .expect(200)
        .end(function (err, res) {
          t.error(err, 'No error');

          _.keys(updatedAttrs).forEach(function (attr) {
            t.equal(
              res.body.data.attributes[attr],
              updatedAttrs[attr],
              `updates ${attr}`
            );
          });

          const untouched = _.keys(_.omit(originalAttrs,
                                          _.keys(updatedAttrs)));

          untouched.forEach(function (attr) {
            t.equal(
              res.body.data.attributes[attr],
              originalAttrs[attr],
              `leaves ${attr} untouched`
            );
          });

          t.end();
        });
    });
  });
}
