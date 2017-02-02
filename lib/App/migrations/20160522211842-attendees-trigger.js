'use strict';

var Promise = require('bluebird');

module.exports = {
  up: function (queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.sequelize.query('DROP TRIGGER IF EXISTS `populate_event_attendees counter on insert`'),
      queryInterface.sequelize.query('DROP TRIGGER IF EXISTS `populate_event_attendees counter on delete`'),
      queryInterface.sequelize.query('CREATE TRIGGER `populate_event_attendees counter on insert` AFTER INSERT ON EventAttendees FOR EACH ROW BEGIN' +
        '  UPDATE Events SET attendeesCount = ( SELECT count(userId) FROM EventAttendees WHERE eventId = new.eventId ) WHERE id = new.eventId;' +
        'END'),
      queryInterface.sequelize.query('CREATE TRIGGER `populate_event_attendees counter on delete` AFTER DELETE ON EventAttendees FOR EACH ROW BEGIN' +
        '  UPDATE Events SET attendeesCount = ( SELECT count(userId) FROM EventAttendees WHERE eventId = old.eventId ) WHERE id = old.eventId;' +
        'END')
    ]);
  },

  down: function (queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.sequelize.query('DROP TRIGGER IF EXISTS `populate_event_attendees counter on insert`'),
      queryInterface.sequelize.query('DROP TRIGGER IF EXISTS `populate_event_attendees counter on delete`')
    ]);
  }
};
