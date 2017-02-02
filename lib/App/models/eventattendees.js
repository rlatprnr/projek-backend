'use strict';

module.exports = function (sequelize, DataTypes) {
  var EventAttendees = sequelize.define('EventAttendees', {
      eventId: {
        type: DataTypes.INTEGER,
        references: null
      },
      userId: {
        type: DataTypes.INTEGER,
        references: null
      },
      registrationData: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    }
  );

  return EventAttendees;
};
