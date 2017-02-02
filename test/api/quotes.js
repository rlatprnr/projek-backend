import test from 'tape';
import request from 'supertest';
import clearDB from '../util/clear-db';
import * as data from '../util/fixtures';
import sinon from 'sinon';

export default function news ({server, app}) {
  clearDB(app.db);

  test('POST /quotes', function (t) {
    const spy = sinon.spy(app.worker, 'publish');

    request(server)
      .post('/quotes')
      .accept('json')
      .type('json')
      .send({
        data: {
          type: 'quotes',
          attributes: data.quote()
        }
      })
      .expect(201)
      .end(function (err, res) {
        t.error(err, 'No error');
        t.equal(res.body.data.type, 'quotes', 'returns quote item');

        app.models.Quote.findAll().then(function (results) {
          if (results.length === 1) {
            t.pass('creates one quote');
          } else {
            t.fail(`expected one quote to be created. Actual ${results.length}`);
          }

          try {
            sinon.assert.calledWithMatch(spy, app.worker.PUBLISH_FEEDABLE, {
              modelName: 'Quote',
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
}
