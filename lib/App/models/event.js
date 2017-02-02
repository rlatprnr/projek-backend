'use strict';

import {hasManyThrough} from './util/associations';
import {manageRoles} from './util/mixins';
import {assign} from 'lodash';

module.exports = function (sequelize, DataTypes) {
  const Event = sequelize.define('Event', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    location: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fromDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: function() {
        return NOW();
      }
    },
    toDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: function() {
        return '0000-00-00 00:00:00';
      }
    },
    attendeesCount: {
      type: DataTypes.DECIMAL,
      defaultValue: false,
      allowNull: false
    },
    maxAttendees: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false
    },
    coverImgUrl: {
      type: DataTypes.STRING,
      allowNull: false
    },
    publicUrl: {
      type: DataTypes.VIRTUAL(),
      get: function() {
        return ('/#/events/' + this.getDataValue('id'));
      }
    },
    registrationFormUrl: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    timestamps: true,
    instanceMethods: assign({}, manageRoles),
    classMethods: {
      associate (models) {
        hasManyThrough({
          source: models.Event,
          target: models.Role,
          through: models.RoleAssignment,
          foreignKeyName: 'assignable'
        });
      }
    }
  });
  return Event;
};
