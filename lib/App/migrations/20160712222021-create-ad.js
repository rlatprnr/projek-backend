'use strict';

module.exports = {
  up: function (sequelize, DataTypes) {
    return sequelize.createTable('Ads', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
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
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE
      }
    });
  },

  down: function (queryInterface, DataTypes) {
    return queryInterface.dropTable('Ads');
  }
};
