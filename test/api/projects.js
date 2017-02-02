import test from 'tape';
import request from 'supertest';
import clearDB from '../util/clear-db';
import * as data from '../util/fixtures';
import sinon from 'sinon';

export default function projects ({server, app}) {
  clearDB(app.db);

  test('POST /projects/:id/updates ', function (t) {
    const spy = sinon.spy(app.worker, 'publish');

    app.models.Project.create(data.project()).then(function (result) {
      request(server)
        .post(`/projects/${result.id}/updates`)
        .accept('json')
        .type('json')
        .send({
          data: {
            type: 'updates',
            attributes: data.update()
          }
        })
        .expect(201)
        .end(function (err, res) {
          t.error(err, 'No error');
          t.equal(res.body.data.type, 'updates', 'returns update');
          t.equal(res.body.data.relationships.project.data.id,
                  result.id.toString(),
                  'assigns update to correct project');

          app.models.Update.findAll().then(function (results) {
            if (results.length === 1) {
              t.pass('creates one update');
            } else {
              t.fail(`expected one update to be created. Actual ${results.length}`);
            }
            try {
              sinon.assert.calledWithMatch(spy, app.worker.PUBLISH_FEEDABLE, {
                modelName: 'Update',
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
  });
}
