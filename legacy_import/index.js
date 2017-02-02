require('babel-core/register');

const _ = require('lodash');
const path = require('path');
const scriptName = process.argv[2];
const bunyan = require('bunyan');
const logger = bunyan.createLogger({name: 'legacy-import'});
const App = require('../lib/App').default;
const app = App({logger});

if (!scriptName) {
  logger.fatal(new Error('must supply script name as argument'));
  process.exit();
}

const scriptPath = path.join(__dirname, scriptName);
logger.info(`Running script at path ${scriptPath}`);

const script = require(scriptPath);

if (!_.isFunction(script)) {
  logger.fatal(new Error('supplied script must be a function'));
  process.exit();
}

app.once('ready', function () {
  const exec = script(app);

  if (!(exec && _.isFunction(exec.then))) {
    logger.fatal(`return a promise from script ${scriptPath}`);
    process.exit();
  }

  exec.then(function () {
    logger.info('Script completed successfully');
    process.exit();
  })

  .catch(function (err) {
    logger.error(err);
    process.exit();
  });
});
