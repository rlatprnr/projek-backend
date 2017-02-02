'use strict';

import Promise from 'bluebird';
import stampit from 'stampit';
import {EventEmitter} from 'events';
import db from './models';
import redis from 'redis';
import gcm from 'node-gcm';
import apn from 'apn';
import Worker from './worker';
import {
  GCM_API_KEY,
  APN_CERTS_PATH,
  USER_BASIC_ROLE,
  USER_AGENT_ROLE
} from './config';

Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

function App () {
  this.readyCount = 0;
  this.models = db;
  this.db = this.models.sequelize;
  this.Sequelize = this.models.Sequelize;
  this.redis = redis.createClient();
  this.gcmSender = new gcm.Sender(GCM_API_KEY);
  this.worker = Worker({app: this});

  this.apnConnection = new apn.Connection({
    cert: `${APN_CERTS_PATH}/cert.pem`,
    key: `${APN_CERTS_PATH}/key.pem`
  })
  .on('error', (err) => {
    this.logger.error('apn error occured', err);
  })
  .on('socketError', (err) => {
    this.logger.error('apn socketError occurred', err);
  })
  .on('transmitted', (notification, device) => {
    this.logger.debug('apn transmission', notification, device);
  })
  .on('completed', () => {
    this.logger.info('apn pending queue completed');
  })
  .on('connected', () => {
    this.logger.info('apn connection established');
  })
  .on('disconnected', () => {
    this.logger.info('apn disconnected');
  })
  .on('timeout', () => {
    this.logger.info('apn timeout');
  })
  .on('transmissionError', (code, notification, device) => {
    this.logger.error(
      'apn transmissionError occured',
      code,
      notification,
      device
    );
  });

  this.worker.once('ready', () => {
    this.logger.info('worker ready...');
    this.onConnect();
  })
  .on('lost', () => {
    this.logger.info('rabbitmq disconnected');
    this.onLost();
  });

  this.db.validate()
    .then(() => {
      this.logger.info('database connection established...');
      this.onConnect();
    })
    .catch((err) => {
      this.logger.error(err);
      this.onLost();
    });
}

const proto = {
  onConnect () {
    if (++this.readyCount === 2) {
      this.emit('ready');
    }
  },

  onLost () {
    this.emit('lost');
  }
};

const EventEmittable = stampit.convertConstructor(EventEmitter);

export default stampit({
  init: App,
  methods: proto,
  props: {USER_BASIC_ROLE, USER_AGENT_ROLE}
}).compose(EventEmittable);
