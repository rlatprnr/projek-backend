'use strict';

import {hasManyThrough} from './util/associations';
import {manageRoles} from './util/mixins';
import {assign} from 'lodash';

module.exports = function (sequelize, DataTypes) {
  var ProjectItem = sequelize.define('ProjectItem', {
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    remoteUrl: {
      type: DataTypes.STRING
    },
    body: {
      type: DataTypes.TEXT
    },
    sort: DataTypes.INTEGER
  }, {
    instanceMethods: assign({}, manageRoles),
    classMethods: {
      associate (models) {
        models.ProjectItem.belongsTo(models.Project);

        hasManyThrough({
          source: models.ProjectItem,
          target: models.Role,
          through: models.RoleAssignment,
          foreignKeyName: 'assignable'
        });
      }
    }
  });
  return ProjectItem;
};
