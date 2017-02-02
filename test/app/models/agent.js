'use strict';

import test from 'tape';
import * as data from '../../util/fixtures';
import phone from 'phone';

export default function ({app}) {
  test('Model: Agent, "set officePhone"', function (t) {
    let attrs;
    let agent;

    attrs = data.agent({officePhone: null});
    agent = app.models.Agent.build(attrs);
    t.equal(agent.officePhone, null, 'leaves null values as is');

    attrs = data.agent({officePhone: data.phone()});
    agent = app.models.Agent.build(attrs);
    t.equal(agent.officePhone, phone(attrs.officePhone)[0], 'formats phone number to E.164');

    attrs = data.agent({officePhone: '555'});
    agent = app.models.Agent.build(attrs);
    t.equal(agent.officePhone, attrs.officePhone, 'leaves phone as original when value does not convert to E.164');

    t.end();
  });

  test('Model: Agent, "validate officePhone"', function (t) {
    let attrs;
    let agent;

    attrs = data.agent({officePhone: '555'});
    agent = app.models.Agent.build(attrs);

    agent.validate().then(function (result) {
      const validatesPhone = result && result.message === `Validation error: ${attrs.officePhone} is not valid`;
      t.ok(validatesPhone, 'requires a valid phone format');
    })

    .then(function () {
      attrs = data.agent({officePhone: null});
      agent = app.models.Agent.build(attrs);
      return agent.validate().then(function (result) {
        t.ok(!result, 'allows null');
        t.end();
      });
    })

    .catch(t.end);
  });
}
