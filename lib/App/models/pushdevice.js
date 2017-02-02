'use strict';

module.exports = function (sequelize, DataTypes) {
  var PushDevice = sequelize.define('PushDevice', {
    registrationId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    unread: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validators: {
        isInt: true,
        min: 0
      }
    },
    platform: {
      type: DataTypes.STRING,
      allowNull: false
    }
  });

  return PushDevice;
};
