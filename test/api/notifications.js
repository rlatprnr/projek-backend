import test from 'tape';
import sinon from 'sinon';
import request from 'supertest';
import clearDB from '../util/clear-db';

export default function notifications ({server, app}) {
  clearDB(app.db);

  test('POST /notifications', function (t) {
    const spy = sinon.spy(app.worker, 'publish');
    const attributes = {
      contentType: 'type',
      contentId: 234223
    };

    request(server)
      .post('/notifications')
      .accept('json')
      .type('json')
      .send({
        data: {
          type: 'notifications',
          attributes: attributes
        }
      })
      .expect(204)
      .end(function (err, res) {
        t.error(err, 'No error');

        try {
          sinon.assert.calledWithMatch(spy, app.worker.PUSH_QUEUE, {
            type: attributes.contentType,
            id: attributes.contentId
          });
          t.pass(`queues ${app.worker.PUSH_QUEUE} job`);
        } catch (e) {
          t.fail(e);
        } finally {
          app.worker.publish.restore();
          t.end();
        }
      });
  });
}
