const path = require('path');
const dotenv = require('dotenv');
const env = process.env.NODE_ENV;

var envPath = '../.env';

if (env === 'production') {
  envPath += '.production';
}

dotenv.config({
  path: path.join(__dirname, envPath)
});
