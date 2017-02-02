'use strict';

module.exports = {
  up: function (sequelize, DataTypes) {
    return sequelize.createTable('EventAttendees', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      eventId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      userId: {
        type: DataTypes.INTEGER,
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
    })
      .then(function() {
        return sequelize.addIndex('EventAttendees', ['eventId', 'userId'], {
          name: 'event_user',
          indicesType: 'UNIQUE'
        });
      });
  },

  down: function (sequelize, DataTypes) {
      return sequelize.dropTable('EventAttendees');
  }
};
