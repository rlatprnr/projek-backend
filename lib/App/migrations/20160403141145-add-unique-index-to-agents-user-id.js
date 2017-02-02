'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addIndex(
      'Agents',
      ['userId'],
      {
        indicesType: 'UNIQUE'
      }
    );
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeIndex(
      'Agents',
      ['userId']
    );
  }
};
