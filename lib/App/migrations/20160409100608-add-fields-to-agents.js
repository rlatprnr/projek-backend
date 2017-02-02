'use strict';

const Promise = require('bluebird');

module.exports = {
  up: function (queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.addColumn(
        'Agents',
        'officeCity',
        {
          type: Sequelize.STRING,
          allowNull: true
        }
      ),
      queryInterface.addColumn(
        'Agents',
        'officeProvince',
        {
          type: Sequelize.STRING,
          allowNull: true
        }
      )
    ]);
  },

  down: function (queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.removeColumn(
        'Agents',
        'officeCity'
      ),
      queryInterface.removeColumn(
        'Agents',
        'officeProvince'
      )
    ]);
  }
};
