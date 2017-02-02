'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`UPDATE PushDevices SET platform = \"android\"`);
  },

  down: function (queryInterface, Sequelize) {
  }
};
