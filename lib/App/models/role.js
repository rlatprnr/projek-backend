'use strict';

import {belongsToManyThrough} from './util/associations';
import {partial} from 'lodash';
import {
  USER_BASIC_ROLE,
  USER_AGENT_ROLE
} from '../config';

module.exports = function (sequelize, DataTypes) {
  var Role = sequelize.define('Role', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isIn: [[USER_BASIC_ROLE, USER_AGENT_ROLE]]
      }
    }
  }, {
    classMethods: {
      associate: function (models) {
        const belongsToMany = partial(belongsToManyThrough,
                                      models.Role,
                                      models.RoleAssignment);

        belongsToMany(models.User);
        belongsToMany(models.Project);
        belongsToMany(models.Attachment);
        belongsToMany(models.NewsArticle);
        belongsToMany(models.Quote);
        belongsToMany(models.Update);
        belongsToMany(models.ProjectItem);
      }
    }
  });

  return Role;
};
