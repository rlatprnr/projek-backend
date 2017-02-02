import Promise from 'bluebird';
import test from 'tape';
import clearDB, {clearDBAsync} from '../util/clear-db';
import * as data from '../util/fixtures';
import sinon from 'sinon';
import makeRequest, {setReqPathParts} from '../util/make-request';
import {issueJwtBearer} from '../../lib/Server/auth';

export default function users ({server, app}) {
  clearDB(app.db);

  test('POST /users', function (t) {
    const workerSpy = sinon.spy(app.worker, 'publish');

    const attrs = data.user();

    const conf = {
      server,
      path: '/users',
      type: 'users',
      method: 'post'
    };

    makeRequest(conf, attrs, {expect: 201}).then(function ({err, res}) {
      app.worker.publish.restore();

      t.error(err, '201 success');

      Promise.join(app.models.User.findAll(), app.models.UserVerification.findAll(), function (users, verifications) {
        if (users.length === 1) {
          t.pass('creates one user');
        } else {
          t.fail(`expected one user to be created. Actual ${users.length}`);
        }

        if (verifications.length === 1) {
          const v = verifications[0];

          if (v.UserId === users[0].id && v.label === 'phone') {
            t.pass('creates one user verification for label "phone"');
            sinon.assert.calledWith(workerSpy, app.worker.SEND_VERIFICATION, {id: v.id});
            t.pass('queues job to send verification token');
          } else {
            t.fail(`expected verification ${JSON.stringify(v.toJSON())} to have UserId ${users[0].id} and label phone`);
          }
        } else {
          t.fail(`expected one user verification to be created. Actual ${verifications.length}`);
        }

        const expected = {
          id: verifications[0].id.toString(),
          type: 'verifications',
          attributes: {
            label: 'phone'
          },
          relationships: {
            user: {
              data: {
                id: users[0].id.toString(),
                type: 'users'
              }
            }
          }
        };

        t.deepEqual(res.body.data, expected, 'returns the verification in the response');
      })

      .then(function () {
        return clearDBAsync(app.db);
      })

      .then(function () {
        return app.models.User.create(data.user()).then(function (user) {
          return makeRequest(conf, data.user({email: user.email}), {expect: 422}).then(function ({err, res}) {
            t.error(err, 'Must provide a unique email address to create a user');
          });
        });
      })

      .then(function () {
        return clearDBAsync(app.db);
      })

      .then(function () {
        return app.models.User.create(data.user()).then(function (user) {
          return makeRequest(conf, data.user({phone: user.phone}), {expect: 422}).then(function ({err, res}) {
            t.error(err, 'Must provide a unique phone to create a user');
          });
        });
      })

      .then(function () {
        t.end();
      })

      .catch(t.end);
    });
  });

  clearDB(app.db);

  test('GET /me', function (t) {
    const conf = {
      server,
      method: 'get'
    };

    app.models.User.create(data.user()).then(function (user) {
      setReqPathParts(conf, 'me');

      return issueJwtBearer(user.id).then(function (jwt) {
        conf.set = {Authorization: `Bearer ${jwt}`};
      }).then(function () {
        return makeRequest(conf, null, {expect: 200}).then(function ({err, res}) {
          t.error(err, '200 success');
          const resData = res.body.data;
          t.ok((resData.type === 'users' && resData.id === user.id.toString()), 'returns the requested user');
        });
      })

      .then(function () {
        return app.models.Agent.create(data.agent({UserId: user.id})).then(function (agent) {
          return makeRequest(conf).then(function ({res}) {
            const rels = res.body.data.relationships;
            const hasAgent = rels.agent &&
                             rels.agent.data.type === 'agents' &&
                             rels.agent.data.id === agent.id.toString();

            t.ok(hasAgent, 'returns user agent relationship when one is present');
          });
        });
      });
    })

    .then(function () {
      t.end();
    })

    .catch(t.end);
  });

  clearDB(app.db);

  test('POST /users/:id/agents', function (t) {
    const conf = {
      server,
      type: 'agents',
      method: 'post'
    };

    const attrs = data.agent();

    app.models.User.create(data.user()).then(function (user) {
      setReqPathParts(conf, 'users', user.id, conf.type);

      conf.set = {Authorization: 'Bearer: 234234jh234kjh23'};
      return makeRequest(conf, attrs, {expect: 401}).then(function ({err, res}) {
        t.error(err, 'requires authenticated user');
      })

      .then(function () {
        return app.models.User.create(data.user()).then(function (otherUser) {
          return issueJwtBearer(otherUser.id).then(function (jwt) {
            conf.set = {Authorization: `Bearer ${jwt}`};
          })

          .then(function () {
            return makeRequest(conf, attrs, {expect: 403}).then(function ({err, res}) {
              t.error(err, 'requires authorized user');
            });
          });
        });
      })

      .then(function () {
        return issueJwtBearer(user.id).then(function (jwt) {
          conf.set = {Authorization: `Bearer ${jwt}`};
        });
      })

      .then(function () {
        return makeRequest(conf, attrs, {expect: 201}).then(function ({err, res}) {
          t.error(err, '201 success');
          t.equal(res.body.data.type, 'agents', 'returns agent payload');

          app.models.Agent.findAll().then(function (results) {
            if (results.length === 1) {
              t.pass('creates one agent');
            } else {
              t.fail(`expected one agent to be created. Actual ${results.length}`);
            }

            if (results.length && results[0].UserId === user.id) {
              t.pass('assigns agent to user');
            } else {
              t.fail(`expected agent to be assigned to user in request. actual data: ${JSON.stringify(results.map((r) => r.toJSON()))}`);
            }
          });
        });
      })

      .then(function () {
        return makeRequest(conf, attrs, {expect: 422}).then(function ({err, res}) {
          t.error(err, 'responds 422 if user is already assigned an agent');
          t.end();
        });
      });
    })

    .catch(t.end);
  });
}
