'use strict';

const _ = require('lodash');
const Promise = require('bluebird');

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.sequelize.query('select id,url,name from Attachments').then(function (results) {
      return Promise.each(_.flatten(results), function (result) {
        const url = result.url;
        const id = result.id;
        const newName = unescape(url.replace(/^.*[\\\/]/, ''));
        return queryInterface.sequelize.query(`UPDATE Attachments SET name = \"${newName}\" WHERE id = ${id}`);
      });
    });
  },

  down: function (queryInterface, Sequelize) {
  }
};
