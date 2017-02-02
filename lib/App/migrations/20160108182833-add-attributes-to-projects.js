'use strict';

const Promise = require('bluebird');

function toAdd (Sequelize) {
  return [
    {
      name: 'body',
      spec: {
        type: Sequelize.TEXT,
        allowNull: false
      }
    },
    {
      name: 'coverImgUrl',
      spec: {
        type: Sequelize.STRING,
        allowNull: false
      }
    },
    {
      name: 'coverVideoUrl',
      spec: {
        type: Sequelize.STRING
      }
    }
  ];
}

module.exports = {
  up (queryInterface, Sequelize) {
    return Promise.all(
      toAdd(Sequelize).map(function (attr) {
        return queryInterface.addColumn(
          'Projects',
          attr.name,
          attr.spec
        );
      })
      .concat(
        queryInterface.changeColumn('Projects', 'title', {
          type: Sequelize.STRING,
          allowNull: false
        })
      )
    );
  },

  down (queryInterface, Sequelize) {
    return Promise.all(
      toAdd(Sequelize).map(function (attr) {
        return queryInterface.removeColumn(
          'Projects',
          attr.name
        );
      })
      .concat(
        queryInterface.changeColumn(
          'Projects',
          'title',
          {
            type: Sequelize.STRING,
            allowNull: true
          }
        )
      )
    );
  }
};
