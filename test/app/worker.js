'use strict';

import test from 'tape';
import sinon from 'sinon';

export default function worker ({app}) {
  test('Worker#publish', function (t) {
    const spy = sinon.spy(app.worker.exchange, 'publish');
    app.worker.publish('foo', {foo: 'bar'});
    const assert = spy.calledWith({foo: 'bar'}, {key: 'foo'});
    t.ok(assert, 'sends data to queue');
    app.worker.exchange.publish.restore();
    t.end();
  });
}
