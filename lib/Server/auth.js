import Promise from 'bluebird';
import {JWT_SECRET, JWT_TOKEN_LIFETIME} from './config';
import passport from 'passport';
import {Strategy} from 'passport-http-bearer';
import createError from 'http-errors';

const jwt = Promise.promisifyAll(require('jsonwebtoken'));

function env () {
  return process.env.NODE_ENV || 'development';
}

function options () {
  return {
    issuer: `projek:api:${env()}`,
    subject: 'user',
    expiresIn: JWT_TOKEN_LIFETIME
  };
}

export function issueJwtBearer (userId) {
  return new Promise(function (resolve) {
    return jwt.sign({id: userId}, JWT_SECRET, options(), resolve);
  });
}

export function verifyJwtBearer (token) {
  return jwt.verifyAsync(token, JWT_SECRET, options());
}

export function authenticate () {
  return function (req, res, next) {
    passport.authenticate('bearer', {session: false}, function (err, user, info) {
      if (err) { return next(err); }
      if (!user) { return next(createError(401, 'Unauthorized')); }
      req.user = user;
      next();
    })(req, res, next);
  };
}

export function authenticateIfAuth () {
  return function (req, res, next) {
    if (req.headers && req.headers.authorization && /Bearer/.test(req.headers.authorization)) {
      const authenticator = authenticate();
      authenticator(req, res, next);
    } else {
      next();
    }
  };
}

export function authorizeSameUser ({compareTo} = {}) {
  return function (req, res, next) {
    const comparison = compareTo || req.params.id;
    if (!(req.user.id.toString() === comparison.toString())) {
      next(createError(403, 'You do not have permission'));
    } else {
      next();
    }
  };
}

export default function (app) {
  return new Strategy(function (token, done) {
    verifyJwtBearer(token).then(function (decoded) {
      return app.models.User.findById(decoded.id, {
        include: [app.models.Agent]
      });
    })

    .then(function (user) {
      if (!user) { return done(null, false); }
      return done(null, user);
    })

    .catch(jwt.TokenExpiredError, jwt.JsonWebTokenError, function () {
      done(null, false);
    })

    .catch(done);
  });
}
