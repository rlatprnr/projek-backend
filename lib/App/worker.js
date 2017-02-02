import stampit from 'stampit';
import {EventEmitter} from 'events';
import jackrabbit from 'jackrabbit';
import {partialRight} from 'lodash';
import Queue from './queue';
import {
  push,
  feedable,
  sendVerification
} from './jobs';

import {
  PUSH_QUEUE,
  PUBLISH_FEEDABLE,
  SEND_VERIFICATION
} from './config';

function WorkerQueue () {
  this.logger = this.app.logger;
  this.jr = jackrabbit('amqp://guest:guest@localhost');
  this.exchange = this.jr.default();

  this.jr.once('connected', () => {
    this.logger.info('rabbitmq connection established...');
    this.emit('ready');
  })
  .on('error', (err) => {
    this.logger.error(err);
  })
  .on('close', () => {
    this.logger.info('rabbitmq disconnected');
    this.emit('lost');
  });

  const makeQueue = (name, job) => {
    return Queue({
      name,
      exchange: this.exchange,
      logger: this.logger,
      job: partialRight(job, this.app)
    });
  };

  this.queues = [
    makeQueue(this.PUSH_QUEUE, push),
    makeQueue(this.PUBLISH_FEEDABLE, feedable),
    makeQueue(this.SEND_VERIFICATION, sendVerification)
  ];
}

const proto = {
  consumeAllQueues () {
    this.queues.forEach((q) => q.consume());
  },

  publish (queueName, data) {
    this.exchange.publish(data, {key: queueName});
  }
};

const EventEmittable = stampit.convertConstructor(EventEmitter);

export default stampit({
  init: WorkerQueue,
  methods: proto,
  props: {
    PUSH_QUEUE,
    PUBLISH_FEEDABLE,
    SEND_VERIFICATION
  }
}).compose(EventEmittable);
