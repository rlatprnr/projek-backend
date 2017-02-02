'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`UPDATE PushDevices SET platform = \"ios\" WHERE char_length(registrationId) = 64`);
  },

  down: function (queryInterface, Sequelize) {
  }
};
