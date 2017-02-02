'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn(
      'Events',
      'maxAttendees',
      {
        type: Sequelize.INTEGER.UNSIGNED,
        defaultValue: 0,
        allowNull: false
      }
    )
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn(
      'Events',
      'maxAttendees'
    )
  }
};
