'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.changeColumn(
      'NewsArticles',
      'url',
      {
        type: Sequelize.STRING,
        allowNull: true
      }
    );
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.changeColumn(
      'NewsArticles',
      'url',
      {
        type: Sequelize.STRING,
        allowNull: false
      }
    );
  }
};
