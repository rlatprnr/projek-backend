'use strict';
module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable('Quotes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      quote: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      authorName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      authorTitle: {
        type: Sequelize.STRING,
        allowNull: false
      },
      authorImgUrl: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: function (queryInterface, Sequelize) {
    return queryInterface.dropTable('Quotes');
  }
};
