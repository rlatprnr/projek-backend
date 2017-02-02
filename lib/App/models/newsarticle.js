'use strict';

import {hasManyThrough} from './util/associations';
import {manageRoles} from './util/mixins';
import {assign} from 'lodash';

module.exports = function (sequelize, DataTypes) {
  const NewsArticle = sequelize.define('NewsArticle', {
    body: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    coverImgUrl: {
      type: DataTypes.STRING,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    url: {
      type: DataTypes.STRING
    }
  }, {
    timestamps: true,
    instanceMethods: assign({}, manageRoles),
    classMethods: {
      associate (models) {
        hasManyThrough({
          source: models.NewsArticle,
          target: models.Role,
          through: models.RoleAssignment,
          foreignKeyName: 'assignable'
        });
      }
    }
  });
  return NewsArticle;
};
