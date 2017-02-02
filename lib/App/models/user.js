'use strict';

import phone from 'phone';
import {hasManyThrough} from './util/associations';
import {manageRoles} from './util/mixins';
import {assign} from 'lodash';

module.exports = function (sequelize, DataTypes) {
  var User = sequelize.define('User', {
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      set: function (val) {
        // leave for validations if cannot format
        let formatted = phone(val)[0] || val;
        this.setDataValue('phone', formatted);
      },
      validate: {
        isPhone: function (val) {
          if (!phone(val)[0]) {
            throw new Error(`${val} is not valid`);
          }
        }
      }

    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false

    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false

    }
  }, {
    instanceMethods: assign({}, manageRoles),
    classMethods: {
      findOneByEmail: function (value) {
        return this.findOne({where: {email: value}});
      },

      findOneByPhone: function (value) {
        const formatted = phone(value)[0];
        const query = {
          where: {
            phone: formatted || value
          }
        };

        return this.findOne(query);
      },

      associate: function (models) {
        models.User.hasMany(models.UserVerification);
        models.User.hasOne(models.Agent);

        hasManyThrough({
          source: models.User,
          target: models.Role,
          through: models.RoleAssignment,
          foreignKeyName: 'assignable'
        });
      }
    }
  });
  return User;
};
