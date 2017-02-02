import stampit from 'stampit';
import bunyan from 'bunyan';
import bunyanRequest from 'bunyan-request-logger';
import SlackStream from 'bunyan-slack';
import {omit} from 'lodash';

function getFullStack (err) {
  let ret = err.stack || err.toString();
  let cause;

  if (err.cause && typeof (err.cause) ===
      'function') {
    cause = err.cause();
    if (cause) {
      ret += '\nCaused by: ' +
        getFullStack(cause);
    }
  }
  return ret;
}

const serializers = {
  req (req) {
    if (!req || !req.connection) {
      return req;
    }

    return {
      url: req.url,
      method: req.method,
      protocol: req.protocol,
      requestId: req.requestId,

      // In case there's a proxy server:
      ip: req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress,
      headers: req.headers
    };
  },

  res (res) {
    if (!res) {
      return res;
    }

    return {
      statusCode: res.statusCode,
      headers: res._header,
      requestId: res.requestId,
      responseTime: res.responseTime
    };
  },

  err (err) {
    if (!err) { return err; }

    return {
      message: err.message,
      name: err.name,
      stack: getFullStack(err),
      code: err.code,
      signal: err.signal,
      requestId: err.requestId
    };
  }
};

function slackFormatter (record, levelName) {
  const threadName = `${record.hostname || 'api server'} error logger`;

  function errSummary (record) {
    if (!record.err) { return record.msg || 'Unknown Error'; }
    return `${record.err.name}: ${record.err.message}`;
  }

  let text = '';
  text += `*[${levelName.toUpperCase()}]* at \`${record.time}\` from \`${record.name}:${record.component}\` on \`${record.hostname || 'localhost'}\`\n\n`;
  text += `\`\`\`${errSummary(record)}\`\`\``;

  if (record.err) {
    text += '\n\n';
    text += `\`\`\`${JSON.stringify(omit(record.err, 'message', 'stack', 'name'))}\`\`\``;

    if (record.err.name === 'InternalServerError' && record.err.stack) {
      text += '\n\nBacktrace:';
      text += `\`\`\`${record.err.stack}\`\`\``;
    }
  }

  return {text: text, username: threadName};
}

function slackStream () {
  return new SlackStream({
    webhook_url: process.env.SLACK_WEBHOOK,
    channel: process.env.SLACK_CHANNEL,
    username: 'bot',
    icon_emoji: ':boom:',
    customFormatter: slackFormatter
  });
}

function streams () {
  let streams = [{
    level: bunyan.INFO,
    stream: process.stdout
  }];

  if (!(process.env.NODE_ENV === 'test')) {
    streams.push({
      stream: slackStream(),
      level: bunyan.WARN
    });
  }

  return streams;
}

function Logger () {
  ['name', 'component'].forEach((required) => {
    if (!this[required]) {
      throw new Error(`Logger requires ${required}`);
    }
  });

  return bunyanRequest({
    name: this.name,
    component: this.component,
    streams: streams(),
    serializers: this.serializers,
    src: !(process.env.NODE_ENV === 'production')
  });
}

export default stampit({
  init: Logger,
  refs: {serializers}
});
