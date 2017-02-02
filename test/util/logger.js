export default {
  info (msg) { console.log(msg); },
  error (err) { throw err; },
  warn (msg) { console.log(msg); },
  errorLogger () {
    return function (req, res, next) {
      next();
    };
  },
  requestLogger () {
    return function (req, res, next) {
      next();
    };
  }
};
