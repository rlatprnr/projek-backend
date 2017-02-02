'use strict';

import test from 'tape';
import * as data from '../../util/fixtures';
import clearDB from '../../util/clear-db';
import {sample} from 'lodash';

export default function jobs ({app}) {
  clearDB(app.db);

  test('Model: UserVerification, before hooks', function (t) {
    app.models.UserVerification.create(data.userVerification()).then(function (result) {
      t.ok(result.secret.length, 'sets a secret');
      t.end();
    })

    .catch(t.end);
  });

  test('Model: UserVerification, "instance.verify()"', function (t) {
    return app.models.UserVerification.create({label: sample(['phone', 'email'])}).then(function (verification) {
      if (verification.verifiedAt) {
        t.fail(`expected existing verification "verifiedAt" to be null, got ${verification.verifiedAt}`);
      }

      return verification.verify(verification.currentToken())
        .then(function () {
          return verification.reload();
        })

        .then(function (verification) {
          t.ok(verification.verifiedAt, 'updates verification "verifiedAt"');
          t.end();
        });
    })

    .catch(t.end);
  });
}
