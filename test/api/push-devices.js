import {random, every} from 'lodash';
import test from 'tape';
import request from 'supertest';
import clearDB from '../util/clear-db';
import * as data from '../util/fixtures';

export default function projects ({server, app}) {
  function makeRequest (attrs) {
    return new Promise(function (resolve, reject) {
      request(server)
        .post('/push_devices')
        .type('json')
        .send({
          data: {
            type: 'push_devices',
            attributes: attrs
          }
        })
        .expect(204)
        .end(resolve);
    });
  }

  clearDB(app.db);

  test('POST /push_devices', function (t) {
    const pushDeviceAttrs = data.pushDevice();

    makeRequest(pushDeviceAttrs).then(function (err, res) {
      t.error(err, 'Succeeds with a 204');

      return app.models.PushDevice.findAll({
        where: pushDeviceAttrs
      }).then(function (results) {
        if (results.length === 1) {
          t.pass('creates one push device');
        } else {
          t.fail(`expected one push device to be created. Actual ${results.length}`);
        }
      });
    })

    .then(function () {
      return makeRequest(pushDeviceAttrs).then(function (err, res) {
        t.error(err, 'Allows requests with same registrationId & platform');

        return app.models.PushDevice.findAll().then(function (results) {
          if (results.length === 1) {
            t.pass('Does not re-create PushDevice from request with same registrationId & platform');
          } else {
            t.fail(`expected no PushDevices to be created. Actual ${results.length - 1}`);
          }
        });
      });
    })

    .then(function () {
      return app.models.PushDevice.update({unread: random(2, 50)}, {where: {}});
    })

    .then(function () {
      return makeRequest(pushDeviceAttrs).then(function () {
        return app.models.PushDevice.findAll().then(function (results) {
          if (results.length > 0 && every(results, {unread: 0})) {
            t.pass('resets device unread count');
          } else {
            t.fail(`expected device unread count to be reset. Actual value: ${results.map((r) => r.unread)}`);
          }

          t.end();
        });
      });
    })

    .catch(t.end);
  });

  clearDB(app.db);

  test('POST /push_devices with legacy payload', function (t) {
    // explicitly excluding platform attribute
    const pushDeviceAttrs = {registrationId: data.pushDevice().registrationId};

    makeRequest(pushDeviceAttrs).then(function (err, res) {
      t.error(err, 'Succeeds with a 204');

      return app.models.PushDevice.findAll({
        where: {
          registrationId: pushDeviceAttrs.registrationId,
          platform: 'android'
        }
      }).then(function (results) {
        if (results.length === 1) {
          t.pass('defaults missing platform parameter to "android"');
        } else {
          t.fail(`expected one push device to be created for platform "android". Actual ${results.length}`);
        }

        t.end();
      });
    });
  });

  clearDB(app.db);

  test('POST /push_devices with an ios ID but missing or incorrect platform', function (t) {
    // ios registration IDS are always 64 hex chars
    const iosDeviceID = 'a8b7aa819d7d671567d4f81c9ae23c04e34383384f30cb79767c88594b20f53b';

    // explicitly excluding platform attribute
    const pushDeviceAttrs = {registrationId: iosDeviceID};

    makeRequest(pushDeviceAttrs).then(function (err, res) {
      t.error(err, 'Succeeds with a 204');

      return app.models.PushDevice.findAll({
        where: {
          registrationId: pushDeviceAttrs.registrationId
        }
      }).then(function (results) {
        if (results.length === 1 && results[0].platform === 'ios') {
          t.pass('sets device platform to "ios"');
        } else {
          t.fail(`expected one push device to be created for platform "ios". Actual ${results.length} for platform ${results[0].platform}`);
        }

        t.end();
      });
    });
  });
}
