'use strict';

import {hasManyThrough} from './util/associations';
import {manageRoles} from './util/mixins';
import {assign} from 'lodash';

module.exports = function (sequelize, DataTypes) {
  var Quote = sequelize.define('Quote', {
    quote: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    authorName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    authorTitle: {
      type: DataTypes.STRING,
      allowNull: false
    },
    authorImgUrl: DataTypes.STRING
  }, {
    instanceMethods: assign({}, manageRoles),
    classMethods: {
      associate (models) {
        hasManyThrough({
          source: models.Quote,
          target: models.Role,
          through: models.RoleAssignment,
          foreignKeyName: 'assignable'
        });
      }
    }
  });

  return Quote;
};
