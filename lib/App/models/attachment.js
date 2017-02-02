'use strict';

import {hasManyThrough} from './util/associations';
import {manageRoles} from './util/mixins';
import {assign} from 'lodash';

module.exports = function (sequelize, DataTypes) {
  const Attachment = sequelize.define('Attachment', {
    url: {
      type: DataTypes.STRING,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    timestamps: true,
    instanceMethods: assign({}, manageRoles),
    classMethods: {
      associate (models) {
        models.Attachment.belongsTo(models.Project);

        hasManyThrough({
          source: models.Attachment,
          target: models.Role,
          through: models.RoleAssignment,
          foreignKeyName: 'assignable'
        });
      }
    }
  });
  return Attachment;
};
