import Promise from 'bluebird';
import request from 'supertest';
import {each} from 'lodash';

export function setReqPathParts (conf, ...parts) {
  conf.path = `/${parts.join('/')}`;

  if (parts[1] && parts.length <= 2) {
    conf.id = parts[1];
  }
}

export default function ({server, set, path, type, method, id}, attrs, assertions = {}) {
  return new Promise(function (resolve, reject) {
    let data = {
      type: type,
      attributes: attrs
    };

    if (id) {
      data.id = id;
    }

    let req = request(server)[method](path)
      .type('json')
      .accept('json');

    each((set || {}), function (val, key) {
      req.set(key, val);
    });

    if (attrs) {
      req.send({
        data: data
      });
    }

    each(assertions, function (val, key) {
      req[key](val);
    });

    req.end(function (err, res) {
      resolve({err, res});
    });
  });
}
