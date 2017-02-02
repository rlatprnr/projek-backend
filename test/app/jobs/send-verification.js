'use strict';

import Promise from 'bluebird';
import {partial} from 'lodash';
import test from 'tape';
import * as data from '../../util/fixtures';
import clearDB from '../../util/clear-db';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const sendEmail = sinon.stub().returns(Promise.resolve());
const sendSMS = sinon.stub().returns(Promise.resolve());

const job = proxyquire('../../../lib/App/jobs/send-verification', {
  '../send-email': {default: sendEmail},
  '../send-sms': {default: sendSMS}
}).default;

export default function jobs ({app}) {
  clearDB(app.db);

  function assertRequiredInput (t) {
    t.throws(partial(job, {id: undefined}, app),
             /Error/,
             'Requires "id" argument');

    t.throws(partial(job, {id: 1}, undefined),
             /Error/,
             'Requires "app" argument');

    return job({id: 1234}, app).then(function () {
      t.fail('expected job to fail when supplied invalid verification id');
    }).catch(function () {
      t.pass('requires "id" argument to represent an existing verification');
    });
  }

  function createUserWithVerification (type) {
    return app.models.User.create(data.user()).then(function (user) {
      return Promise.props({
        user: user,
        verification: app.models.UserVerification.create({
          UserId: user.id,
          label: type
        })
      });
    });
  }

  test('Job: sendVerification, type: email', function (t) {
    assertRequiredInput(t).then(partial(createUserWithVerification, 'email'))

    .then(function ({user, verification}) {
      return job({id: verification.id}, app).then(function () {
        const noSMS = sendSMS.notCalled;
        const assertion = sendEmail.calledWith({
          to: user.email,
          subject: 'Projek Verification',
          body: sinon.match(verification.currentToken())
        });

        t.ok((noSMS && assertion), 'sends email containing verification token to user email');
      });
    })

    .then(function () {
      sendEmail.reset();
      t.end();
    })

    .catch(t.end);
  });

  test('Job: sendVerification, type: phone', function (t) {
    assertRequiredInput(t).then(partial(createUserWithVerification, 'phone'))

    .then(function ({user, verification}) {
      return job({id: verification.id}, app).then(function () {
        const noEmail = sendEmail.notCalled;
        const assertion = sendSMS.calledWith({
          to: user.phone,
          message: sinon.match(verification.currentToken())
        });

        t.ok((noEmail && assertion), 'sends SMS containing verification token to user phone');
      });
    })

    .then(function () {
      sendSMS.reset();
      t.end();
    })

    .catch(t.end);
  });
}
