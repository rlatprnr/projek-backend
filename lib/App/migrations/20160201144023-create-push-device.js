'use strict';
module.exports = {
  up (queryInterface, Sequelize) {
    return queryInterface.createTable('PushDevices', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      registrationId: {
        type: Sequelize.STRING,
        allowNull: false
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
  down (queryInterface, Sequelize) {
    return queryInterface.dropTable('PushDevices');
  }
};
