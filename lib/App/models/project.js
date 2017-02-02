'use strict';

import {hasManyThrough} from './util/associations';
import {manageRoles} from './util/mixins';
import {assign} from 'lodash';

module.exports = function (sequelize, DataTypes) {
  const Project = sequelize.define('Project', {
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    coverImgUrl: {
      type: DataTypes.STRING,
      allowNull: false
    },
    coverVideoUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    }
  }, {
    timestamps: true,
    instanceMethods: assign({}, manageRoles),
    classMethods: {
      associate (models) {
        models.Project.hasMany(models.Attachment);
        models.Project.hasMany(models.Update);
        models.Project.hasMany(models.ProjectItem);

        hasManyThrough({
          source: models.Project,
          target: models.Role,
          through: models.RoleAssignment,
          foreignKeyName: 'assignable'
        });
      }
    }
  });
  return Project;
};
