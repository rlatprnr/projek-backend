'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn(
      'Events',
      'registrationFormUrl',
      {
        type: Sequelize.TEXT,
        allowNull: true
      }
    )
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn(
      'Events',
      'registrationFormUrl'
    )
  }
};
