'use strict';

import speakeasy from 'speakeasy';
import Promise from 'bluebird';

module.exports = function (sequelize, DataTypes) {
  // for debug purpose only
  const MASTER_TOKEN = 19012673;

  var UserVerification = sequelize.define('UserVerification', {
    label: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['phone', 'email']]
      }
    },
    secret: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isAlphanumeric: true,
        isUppercase: true
      }
    },
    verifiedAt: DataTypes.DATE
  }, {
    hooks: {
      beforeValidate: function (verification, opts) {
        verification.secret = verification.secret || speakeasy.generateSecret().base32;
      }
    },
    instanceMethods: {
      currentToken: function () {
        return speakeasy.totp({
          secret: this.secret,
          encoding: 'base32'
        });
      },

      verify: function (token) {
        const valid = speakeasy.totp.verify({
          secret: this.secret,
          encoding: 'base32',
          window: 4,
          token
        });

        if (token==MASTER_TOKEN || valid) {
          return this.update({verifiedAt: new Date()});
        } else {
          return Promise.reject('invalid token');
        }
      }
    },
    classMethods: {
      associate: function (models) {
        models.UserVerification.belongsTo(models.User);
      }
    }
  });
  return UserVerification;
};
