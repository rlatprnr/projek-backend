import stampit from 'stampit';
import {find, clone, omit} from 'lodash';

import createError, {InternalServerError} from 'http-errors';
import {
  ValidationError as RequestError
} from 'express-validation';

import Sequelize from 'sequelize';

const defaultError = new InternalServerError('Something went wrong');
const defaults = {err: defaultError};

function mergeError (err) {
  return omit(clone(err),
    'message',
    'name',
    'flatten',
    'status',
    'statusText',
    'toJSON',
    'toString'
  );
}

const SequelizeApiError = stampit().init(function () {
  if (this.err instanceof Sequelize.ValidationError) {
    const msg = this.err.errors.map((e) => `${e.path}: ${e.message}`).join(', ');
    this.err = createError(422, msg, mergeError(this.err));
  }

  if (this.err instanceof Sequelize.UniqueConstraintError) {
    let verb = 'has';
    const fields = this.err.errors.map((e) => e.path.replace(/^.*_/, ''));
    if (fields.length > 1) { verb = 'have'; }
    const msg = `${fields.join(' and ')} ${verb} already been taken`;
    this.err = createError(422, msg, mergeError(this.err));
  }

  const isOther = find([
    'ForeignKeyConstraintError',
    'TimeoutError',
    'ConnectionRefusedError',
    'AccessDeniedError',
    'HostNotFoundError',
    'HostNotReachableError',
    'InvalidConnectionError',
    'ConnectionTimedOutError',
    'InstanceError'
  ], (type) => {
    return this.err instanceof Sequelize[type];
  });

  if (isOther) { this.err = defaultError; }
});

const BadRequestApiError = stampit().init(function () {
  if (this.err instanceof RequestError) {
    const msg = this.err.toJSON().join(', ').replace(/"/g, '');
    this.err = createError(400, msg, mergeError(this.err));
  }
});

const ApiError = stampit({
  refs: defaults
}).compose(
  SequelizeApiError,
  BadRequestApiError,
);

export default function () {
  return function (err, req, res, next) {
    next(ApiError({err}).err);
  };
}
