import Promise from 'bluebird';
import {sample, defaults} from 'lodash';
import test from 'tape';
import clearDB, {clearDBAsync} from '../util/clear-db';
import sinon from 'sinon';
import * as data from '../util/fixtures';
import {verifyJwtBearer} from '../../lib/Server/auth';
import speakeasy from 'speakeasy';
import makeRequest, {setReqPathParts} from '../util/make-request';

export default function news ({server, app}) {
  function chooseLabel () {
    return sample(['phone', 'email']);
  }

  function createUserWithVerification (merge = {}) {
    return app.models.User.create(data.user()).then(function (user) {
      return Promise.props({
        user: user,
        verification: app.models.UserVerification.create(defaults(merge, {
          UserId: user.id,
          label: chooseLabel(),
          verifiedAt: new Date()
        }))
      });
    });
  }

  clearDB(app.db);

  test('POST /verifications', function (t) {
    const workerSpy = sinon.spy(app.worker, 'publish');
    const conf = {server, path: '/verifications', type: 'verifications', method: 'post'};
    const label = chooseLabel();

    app.models.User.create(data.user()).then(function (user) {
      return makeRequest(conf, {label, value: user[label]}, {expect: 201}).then(function ({err, res}) {
        t.error(err, '201 success');

        return app.models.UserVerification.findAll().then(function (results) {
          t.equal(results.length, 1, 'creates one verification');
          t.ok((results[0].UserId === user.id), 'assigns verification to user');
          t.ok((results[0].label === label), 'assigns the requested label to the verification');

          const expected = {
            id: results[0].id.toString(),
            type: 'verifications',
            attributes: {
              label: label
            },
            relationships: {
              user: {
                data: {
                  id: user.id.toString(),
                  type: 'users'
                }
              }
            }
          };

          t.deepEqual(res.body.data, expected, 'returns the verification in the response');

          sinon.assert.calledWith(workerSpy, app.worker.SEND_VERIFICATION, {id: results[0].id});
          workerSpy.reset();
          t.pass('queues job to send verification token');
        });
      });
    })

    .then(function () {
      return clearDBAsync(app.db);
    })

    .then(function () {
      return createUserWithVerification({label, verifiedAt: new Date()}).then(function ({user, verification}) {
        return makeRequest(conf, {label, value: user[label]}, {expect: 201}).then(function ({res}) {
          app.worker.publish.restore();

          return app.models.UserVerification.findAll().then(function (results) {
            t.equal(results.length, 1, 'does not create a new verification when one for the given label already exists');
            t.equal(res.body.data.id, verification.id.toString(), 'returns existing verification when one for the given label already exists');
            t.ok(!results[0].verifiedAt, 'resets "verifiedAt" when verification already exists');

            sinon.assert.calledWith(workerSpy, app.worker.SEND_VERIFICATION, {id: results[0].id});
            t.pass('queues job to send verification token');
          });
        });
      });
    })

    .then(function () {
      return clearDBAsync(app.db);
    })

    .then(function () {
      return makeRequest(conf, {label: label, value: 'notreal'}, {expect: 404}).then(function ({err, res}) {
        t.error(err, 'responds with a 404 when user cannot be found');
      });
    })

    .then(function () {
      t.end();
    })

    .catch(t.end);
  });

  clearDB(app.db);

  test('PUT /verifications/:id', function (t) {
    const conf = {server, type: 'verifications', method: 'put'};

    createUserWithVerification().then(function ({user, verification}) {
      setReqPathParts(conf, conf.type, verification.id);

      return makeRequest(conf, {token: verification.currentToken()}, {expect: 200}).then(function ({err, res}) {
        t.error(err, '200 success');

        const resData = res.body.data;

        t.ok((resData.type === 'bearerTokens' && resData.id), 'responds with a bearer token');
        t.equal(resData.attributes.expires, null, 'responds with a non-expiring bearer token');

        return verifyJwtBearer(resData.id).then(function (decoded) {
          t.equal(decoded.id, user.id, 'responds with a bearer token for the requested user');
        });
      });
    })

    .then(function () {
      return clearDBAsync(app.db);
    })

    .then(function () {
      return createUserWithVerification().then(function ({user, verification}) {
        setReqPathParts(conf, conf.type, verification.id);

        const oneMinuteOneSecondAgo = new Date();
        oneMinuteOneSecondAgo.setSeconds(oneMinuteOneSecondAgo.getSeconds() - 61);

        const oldToken = speakeasy.totp({
          secret: verification.secret,
          encoding: 'base32',
          time: oneMinuteOneSecondAgo.getTime()
        });

        return makeRequest(conf, {token: oldToken}, {expect: 422}).then(function ({err, res}) {
          t.error(err, 'responds 422 with expired token (more than 60 seconds old)');
        });
      });
    })

    .then(function () {
      return clearDBAsync(app.db);
    })

    .then(function () {
      return createUserWithVerification().then(function ({user, verification}) {
        setReqPathParts(conf, conf.type, verification.id);

        return makeRequest(conf, {token: 'notavalidtoken'}, {expect: 422}).then(function ({err, res}) {
          t.error(err, 'responds 422 with an invalid token');
        });
      });
    })

    .then(function () {
      return clearDBAsync(app.db);
    })

    .then(function () {
      const notAValidVerificationId = 234234;
      setReqPathParts(conf, conf.type, notAValidVerificationId);

      return makeRequest(conf, {token: 'notavalidtoken'}, {expect: 404}).then(function ({err, res}) {
        t.error(err, 'responds 404 with a verification id that does not exist');
      });
    })

    .then(function () {
      t.end();
    })

    .catch(t.end);
  });
}
