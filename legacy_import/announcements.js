import _ from 'lodash';
import Promise from 'bluebird';
import request from 'superagent';

const URL = 'http://dev-ws.projek.asia';
const APP_ID = '1';
const APP_KEY = '047290e598586a45f005ef6520a76d2a6c314861';

let fetched = [];

function getInitial (logger) {
  logger.info('fetching initial...');
  return new Promise(function (resolve, reject) {
    request
      .get(`${URL}/announcement/getfeed`)
      .set('X-Projek-APP-Id', APP_ID)
      .set('X-Projek-APP-Key', APP_KEY)
      .set('Accept', 'application/json')
      .end(function (err, res) {
        if (err) { return reject(err); }

        const items = res.body;

        if (!_.isArray(items)) {
          return reject(new Error(`${items} is not an array`));
        }

        fetched.push(...items);
        resolve();
      });
  });
}

function getMore (logger) {
  logger.info(`fetching more... CURRENT COUNT: ${fetched.length}`);
  return new Promise(function (resolve, reject) {
    request
      .post(`${URL}/announcement/getmorefeed`)
      .set('X-Projek-APP-Id', APP_ID)
      .set('X-Projek-APP-Key', APP_KEY)
      .set('Accept', 'application/json')
      .send({lastIndex: fetched.length})
      .end(function (err, res) {
        if (err) { return reject(err); }

        const items = res.body;

        if (!_.isArray(items)) {
          return reject(new Error(`${items} is not an array`));
        }

        fetched.push(...items);

        if (items.length > 0) {
          resolve(getMore(logger));
        } else {
          resolve();
        }
      });
  });
}

function massageLegacyData (data) {
  return data.map(function (item) {
    return {
      summary: item.announcement_content,
      createdAt: new Date(item.announcement_date),
      updatedAt: new Date()
    };
  });
}

module.exports = function (app) {
  const logger = app.logger;

  return getInitial(logger)
    .then(_.partial(getMore, logger))
    .then(function () {
      logger.info(`COUNT: ${fetched.length} items were found.`);
      return app.models.Update.bulkCreate(
        massageLegacyData(fetched),
        {logging: false}
      )

      .then(function () {
        logger.info(`Successfully imported ${fetched.length} items`);
      });
    });
};
