'use strict';

import _ from 'lodash';
import test from 'tape';
import Promise from 'bluebird';

export function clearDBAsync (db) {
  function truncateAll (options) {
    return Promise.all(
      _.map(_.clone(db.models), function (model) {
        return db.query(`DELETE FROM ${model.getTableName()};`);
      })
    );
  }

  return truncateAll();
}

export default function (db) {
  test('clear DB', function (t) {
    clearDBAsync(db).then(function () {
      t.end();
    })

    .catch(t.end);
  });
}
