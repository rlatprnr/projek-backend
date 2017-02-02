'use strict';

module.exports = function (sequelize, DataTypes) {
  const Ad = sequelize.define('Ad', {
    imgUrl: {
      type: DataTypes.STRING,
      allowNull: false
    },
    destUrl: {
      type: DataTypes.STRING,
      allowNull: false
    },
    imgWidth: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0,
      allowNull: false
    },
    imgHeight: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0,
      allowNull: false
    },
  }, {
    timestamps: true
  });
  return Ad;
};
