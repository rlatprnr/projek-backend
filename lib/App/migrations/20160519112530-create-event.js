'use strict';

module.exports = {
  up: function (sequelize, DataTypes) {
    return sequelize.createTable('Events', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      url: {
        type: DataTypes.STRING,
        allowNull: false
      },
      fromDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: function() {
          return NOW();
        }
      },
      toDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: function() {
          return '0000-00-00 00:00:00';
        }
      },
      attendeesCount: {
        type: DataTypes.DECIMAL,
        defaultValue: false,
        allowNull: false
      },
      coverImgUrl: {
        type: DataTypes.STRING,
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
    return queryInterface.dropTable('Event');
  }
};
