'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.changeColumn(
      'ProjectItems',
      'body',
      {
        type: Sequelize.TEXT,
        allowNull: true
      }
    );
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.changeColumn(
      'ProjectItems',
      'body',
      {
        type: Sequelize.TEXT,
        allowNull: false
      }
    );
  }
};
