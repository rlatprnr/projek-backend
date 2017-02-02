'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.changeColumn(
      'Updates',
      'body',
      {
        type: Sequelize.TEXT,
        allowNull: true
      }
    );
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.changeColumn(
      'Updates',
      'body',
      {
        type: Sequelize.TEXT,
        allowNull: false
      }
    );
  }
};
