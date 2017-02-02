// LEGACY SERVER> cd;mysqldump -uroot projek > legacy.sql
// LOCAL> scp -i ~/.ssh/id_projek-prod-vm-keypair.pem ec2-user@ws.projek-indonesia.com:/home/ec2-user/legacy.sql ./legacy_import/legacy.sql
// API SERVER> scp -i ~/.ssh/id_projek-dev-vm-keypair.pem legacy_import/legacy.sql ec2-user@dev.projek.asia:/home/ec2-user/www/api/current/legacy_import/
// API SERVER> mysql -u root -e "CREATE DATABASE IF NOT EXISTS legacy_import"
// API_SERVER> mysql -uroot -D legacy_import < ./legacy_import/legacy.sql
// API_SERVER> node legacy_import users | bunyan -o short

const mysql = require('mysql');
const _ = require('lodash');
const Promise = require('bluebird');
const phone = require('phone');


const query = 'select * from pro_member left join pro_master_city on pro_member.office_temp_city=pro_master_city.city_id left join pro_master_province on pro_member.office_temp_province=pro_master_province.province_id';

function firstName (name) {
  return name.split(' ')[0] || 'undefined';
}

function lastName (name) {
  return name.split(' ').slice(1).join(' ') || 'undefined';
}

function normalizePhone (phone) {
  let formattedPhone = phone;
  if (!formattedPhone) { return null; }
  formattedPhone = formattedPhone.replace(/^62/, '');
  formattedPhone = formattedPhone.replace(/^0/, '');
  formattedPhone = formattedPhone.replace(' ', '');
  formattedPhone = `+62${formattedPhone}`;
  return formattedPhone;
}

module.exports = Promise.method(function (app) {
  const connection = Promise.promisifyAll(mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    database: 'legacy_import'
  }));

  connection.connect();

  let processed = 0;
  let badPhone = 0;
  let uniqError = 0;
  let agentUniqError = 0;
  let created = 0;
  let alreadyImported = 0;
  let validationError = 0;
  let agentValidationError = 0;
  let agentAlreadyImported = 0;
  let agentBadPhone = 0;
  let agentCreated = 0;

  return connection.queryAsync(query).then(function (rows) {
    app.logger.info(`found ${rows.length} users in legacy db`);

    var uniqRows = _.uniqBy(rows, function (row) {
      return row.member_email + row.member_phone;
    });

    _.each(_.groupBy(uniqRows, 'member_gov_id'), function (records, govId) {
      _.each(records, function (record) {
        if (record.member_gov_id === 'n/a') { record.member_gov_id = null; }
        if (record.member_gov_id && record.member_gov_id.length < 5) { record.member_gov_id = null; }
        if (record.member_gov_id) { record.assignAgentRole = true; }
        if (records.length > 1) { record.member_gov_id = null; }
      });
    });

    const rowsWithValidAgentData = _.filter(uniqRows, function (row) {
      return row.member_gov_id;
    }).length;

    const rowsToBeMarkedAsAgent = _.filter(uniqRows, function (row) {
      return row.assignAgentRole;
    }).length;

    app.logger.info(`found ${uniqRows.length} uniq users by (email,phone) in legacy db`);
    app.logger.info(`found ${rowsWithValidAgentData} users having valid agent data in legacy db`);
    app.logger.info(`found ${rowsToBeMarkedAsAgent} users qualified to be marked as agent in legacy db`);

    return Promise.each(uniqRows, function (row) {
      function importUserAgent (user) {
        if (!row.assignAgentRole || !row.member_gov_id) { return; }
        if (user.Roles.length || user.Agent) { agentAlreadyImported++; return; }

        const actions = [];

        if (row.assignAgentRole) {
          actions.push(user.findAndAddRole('agent'));
        }

        if (row.member_gov_id && !user.Agent) {
          let formattedPhone = phone(normalizePhone(row.office_temp_phone))[0];
          if (!formattedPhone) {
            agentBadPhone++;
            app.logger.warn(`Unable to process phone ${row.office_temp_phone} for agent.Processed to ${normalizePhone(row.office_temp_phone)}`);
          }

          actions.push(app.models.Agent.create({
            govId: row.member_gov_id,
            officeName: row.office_temp_name,
            officeCity: row.city_name,
            officeProvince: row.province_name,
            officePhone: formattedPhone,
            UserId: user.id
          }));
        }

        return Promise.all([actions])
          .then(function () {
            agentCreated++;
          })

          .catch(app.Sequelize.UniqueConstraintError, function (err) {
            agentUniqError++;
            app.logger.warn(`Unable to create agent for row ${JSON.stringify(row)} due to unique constraint error ${err.errors.map((e) => e.message)}`);
          })

          .catch(app.Sequelize.ValidationError, function (err) {
            agentValidationError++;
            app.logger.warn(`Unable to create agent for row ${JSON.stringify(row)} due to validation error ${err.message}`);
          });
      }

      processed++;

      if (!phone(normalizePhone(row.member_phone))[0]) {
        badPhone++;
        app.logger.warn(`Unable to create user for phone ${row.member_phone} processed to ${normalizePhone(row.member_phone)}`);
        return Promise.resolve();
      }

      let formattedPhone = phone(normalizePhone(row.member_phone))[0];

      let formattedEmail = row.member_email;
      formattedEmail = formattedEmail.replace('gmailcom', 'gmail.com');
      formattedEmail = formattedEmail.replace('irvan_ar@icloud', 'irvan_ar@icloud.com');

      return app.models.User.findOrInitialize({
        where: {
          email: formattedEmail,
          phone: formattedPhone
        },

        include: [app.models.Agent, app.models.Role]
      })

      .spread(function (user, isNew) {
        if (isNew) {
          user.firstName = firstName(row.member_name);
          user.lastName = lastName(row.member_name);
          user.createdAt = new Date(row.create_date);
          user.updatedAt = new Date(row.create_date);

          return user.save().then(function (user) {
            created++;
            return user;
          });
        } else {
          alreadyImported++;
          return Promise.resolve(user);
        }
      })

      .then(function (user) {
        return user.reload({
          include: [
            app.models.Agent,
            app.models.Role
          ]
        });
      })

      .then(importUserAgent)

      .catch(app.Sequelize.UniqueConstraintError, function (err) {
        uniqError++;
        app.logger.warn(`Unable to create user for row ${JSON.stringify(row)} due to unique constraint error ${err.errors.map((e) => e.message)}`);
      })

      .catch(app.Sequelize.ValidationError, function (err) {
        validationError++;
        app.logger.warn(`Unable to create user for row ${JSON.stringify(row)} due to validation error ${err.message}`);
      });
    })

    .then(function () {
      app.logger.info(`processed count: ${processed}`);
      app.logger.info(`successfully created count: ${created}`);
      app.logger.info(`agents successfully created count: ${agentCreated}`);
      app.logger.info(`already imported count: ${alreadyImported}`);
      app.logger.info(`agents already imported count: ${agentAlreadyImported}`);
      app.logger.info(`bad phone count: ${badPhone}`);
      app.logger.info(`imported agents bad phone count: ${agentBadPhone}`);
      app.logger.info(`uniqness error count: ${uniqError}`);
      app.logger.info(`agents uniqness error count: ${agentUniqError}`);
      app.logger.info(`validation error count: ${validationError}`);
      app.logger.info(`agents validation error count: ${agentValidationError}`);
    });
  });
});
