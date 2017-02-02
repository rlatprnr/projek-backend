'use strict';

module.exports = {
  up (queryInterface, Sequelize) {
    return queryInterface.addColumn(
      'Updates',
      'summary',
      {
        type: Sequelize.TEXT,
        allowNull: false
      }
    );
  },

  down (queryInterface, Sequelize) {
    return queryInterface.removeColumn(
      'Updates',
      'summary'
    );
  }
};
