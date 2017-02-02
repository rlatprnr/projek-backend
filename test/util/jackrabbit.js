import stampit from 'stampit';
import {EventEmitter} from 'events';

const EventEmittable = stampit.convertConstructor(EventEmitter);

function Jackrabbit (url) {
  this.url = url;
  this.consumers = {};

  process.nextTick(() => {
    this.emit('connected');
  });
}

const proto = {
  default () {
    return this;
  },

  queue ({name}) {
    let that = this;

    return {
      consume (fn) {
        const consumer = that.consumers[name];

        if (consumer) {
          throw new Error(`consumer already registered for queue ${name}`);
        }

        that.consumers[name] = fn;
      }
    };
  },

  publish (data, {key}) {
    let consumer = this.consumers[key];

    if (consumer) {
      delete this.consumers[key];
      consumer(data);
    }
  }
};

export default stampit({
  init: Jackrabbit,
  methods: proto
}).compose(EventEmittable);
