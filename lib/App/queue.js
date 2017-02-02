import stampit from 'stampit';

function Queue () {
  this.jrQueue = this.exchange.queue({
    name: this.name,
    prefetch: 5
  });
}

const proto = {
  consume () {
    const onConsume = (data) => {
      this.logger.info(`queue ${this.name} received ${JSON.stringify(data)}`);
      this.job(data);
    };

    this.logger.info(`initiating consumption of queue ${this.name}`);
    this.jrQueue.consume(onConsume, {noAck: true});
  }
};

export default stampit({
  init: Queue,
  methods: proto
});
