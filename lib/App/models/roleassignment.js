'use strict';

module.exports = function (sequelize, DataTypes) {
  var RoleAssignment = sequelize.define('RoleAssignment', {
    roleId: DataTypes.INTEGER,
    assignable: DataTypes.STRING,
    assignableId: {
      type: DataTypes.INTEGER,
      references: null
    }
  });

  return RoleAssignment;
};
