'use strict';

import {hasManyThrough} from './util/associations';
import {manageRoles} from './util/mixins';
import {assign} from 'lodash';

module.exports = function (sequelize, DataTypes) {
  const Update = sequelize.define('Update', {
    body: DataTypes.TEXT,
    summary: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    timestamps: true,
    instanceMethods: assign({}, manageRoles),
    classMethods: {
      associate (models) {
        models.Update.belongsTo(models.Project);

        hasManyThrough({
          source: models.Update,
          target: models.Role,
          through: models.RoleAssignment,
          foreignKeyName: 'assignable'
        });
      }
    }
  });

  return Update;
};
