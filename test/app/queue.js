'use strict';

import test from 'tape';
import sinon from 'sinon';
import Queue from '../../lib/App/queue';

export default function ({app}) {
  test('Queue#consume', function (t) {
    const spy = sinon.spy();

    const queue = Queue({
      exchange: app.worker.exchange,
      logger: app.logger,
      name: 'foobar',
      job: spy
    });

    queue.consume();
    app.worker.publish('foobar', {foo: 'bar'});
    t.ok(spy.calledOnce, 'calls queue job');
    t.ok(spy.calledWith({foo: 'bar'}), 'sends data to job');
    t.end();
  });
}
