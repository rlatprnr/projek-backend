'use strict';

import test from 'tape';
import * as data from '../../util/fixtures';
import clearDB from '../../util/clear-db';
import phone from 'phone';

export default function ({app}) {
  clearDB(app.db);

  test('Model: User, "class.findOneByPhone"', function (t) {
    const attrs = data.user();
    app.models.User.create(attrs).then(function (result) {
      if (result.phone === attrs.phone) {
        throw new Error('test expects phone input to be unformatted');
      }

      return app.models.User.findOneByPhone(attrs.phone).then(function (result) {
        t.ok(result, 'formats phone input before running query');
        t.end();
      });
    })

    .catch(t.end);
  });

  test('Model: User, "set phone"', function (t) {
    let attrs;
    let user;

    attrs = data.user();
    user = app.models.User.build(attrs);
    t.equal(user.phone, phone(attrs.phone)[0], 'formats phone number to E.164');

    attrs = data.user({phone: '555'});
    user = app.models.User.build(attrs);
    t.equal(user.phone, attrs.phone, 'leaves phone as original when value does not convert to E.164');

    t.end();
  });

  test('Model: User, "validate phone"', function (t) {
    const attrs = data.user({phone: '555'});
    const user = app.models.User.build(attrs);

    user.validate().then(function (result) {
      const validatesPhone = result && result.message === `Validation error: ${attrs.phone} is not valid`;
      t.ok(validatesPhone, 'requires a valid phone format');
      t.end();
    });
  });
}
