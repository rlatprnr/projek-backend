import Promise from 'bluebird';
import test from 'tape';
import {defaults, pick, sample, keys, omit, every, map} from 'lodash';
import clearDB from '../util/clear-db';
import * as data from '../util/fixtures';
import makeRequest, {setReqPathParts} from '../util/make-request';
import {issueJwtBearer} from '../../lib/Server/auth';

export default function agents ({server, app}) {
  clearDB(app.db);

  function createAgentWithUser (merge = {}) {
    return app.models.User.create(data.user()).then(function (user) {
      return Promise.props({
        user: user,
        agent: app.models.Agent.create(defaults({}, merge, {
          UserId: user.id
        }))
      });
    });
  }

  test('GET /agents/:id', function (t) {
    const conf = {
      server,
      type: 'agents',
      method: 'get'
    };

    createAgentWithUser(data.agent()).then(function ({agent, user}) {
      setReqPathParts(conf, conf.type, agent.id);

      conf.set = {Authorization: 'Bearer: 234234jh234kjh23'};
      return makeRequest(conf, null, {expect: 401}).then(function ({err, res}) {
        t.error(err, 'requires authenticated user');
      })

      .then(function () {
        return app.models.User.create(data.user()).then(function (otherUser) {
          return issueJwtBearer(otherUser.id).then(function (jwt) {
            conf.set = {Authorization: `Bearer ${jwt}`};
          })

          .then(function () {
            return makeRequest(conf, null, {expect: 403}).then(function ({err, res}) {
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
        return makeRequest(conf, null, {expect: 200}).then(function ({err, res}) {
          t.error(err, '200 success');
          t.deepEqual([res.body.data.type, res.body.data.id], ['agents', agent.id.toString()], 'returns agent payload');
          t.end();
        });
      });
    })

    .catch(t.end);
  });

  test('PATCH /agents/:id', function (t) {
    const conf = {
      server,
      type: 'agents',
      method: 'patch'
    };

    const attrs = data.agent();

    createAgentWithUser(attrs).then(function ({agent, user}) {
      const originalAttrs = pick(agent.toJSON(), ...keys(attrs));
      const updatedAttrs = pick(data.agent(), sample(keys(omit(originalAttrs, 'officePhone'))));
      const untouchedAttrs = omit(originalAttrs, keys(updatedAttrs));

      setReqPathParts(conf, conf.type, agent.id);

      conf.set = {Authorization: 'Bearer: 234234jh234kjh23'};
      return makeRequest(conf, updatedAttrs, {expect: 401}).then(function ({err, res}) {
        t.error(err, 'requires authenticated user');
      })

      .then(function () {
        return app.models.User.create(data.user()).then(function (otherUser) {
          return issueJwtBearer(otherUser.id).then(function (jwt) {
            conf.set = {Authorization: `Bearer ${jwt}`};
          })

          .then(function () {
            return makeRequest(conf, updatedAttrs, {expect: 403}).then(function ({err, res}) {
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
        return makeRequest(conf, updatedAttrs, {expect: 200}).then(function ({err, res}) {
          t.error(err, '200 success');
          t.deepEqual([res.body.data.type, res.body.data.id], ['agents', agent.id.toString()], 'returns agent payload');

          function everyProperty (source, compare) {
            return every(map(compare, function (val, key) {
              return source[key] === val;
            }), Boolean);
          }

          if (everyProperty(res.body.data.attributes, updatedAttrs) && everyProperty(res.body.data.attributes, untouchedAttrs)) {
            t.pass(`for changed attrs of ${keys(updatedAttrs).join(', ')} in request, response includes updated values for ${keys(updatedAttrs).join(', ')} and untouched values for ${keys(untouchedAttrs).join(', ')}`);
          } else {
            t.fail(`expected response to have updated attrs ${JSON.stringify(updatedAttrs)} and untouched attrs ${JSON.stringify(untouchedAttrs)}. Actual result: ${JSON.stringify(res.body.data.attributes)}`);
          }

          t.end();
        });
      });
    })

    .catch(t.end);
  });
}
