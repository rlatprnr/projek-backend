import _ from 'lodash';
import Promise from 'bluebird';
import request from 'superagent';

const URL = 'http://ws.projek-indonesia.com';
const APP_ID = '1';
const APP_KEY = '047290e598586a45f005ef6520a76d2a6c314861';

let fetched = [];

function getInitial (logger) {
  logger.info('fetching initial...');
  return new Promise(function (resolve, reject) {
    request
      .get(`${URL}/news/getfeed`)
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
      .post(`${URL}/news/getmorefeed`)
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

function massageLegacyNews (news) {
  return news.map(function (item) {
    return {
      body: item.news_content,
      coverImgUrl: item.news_image_url,
      title: item.news_title,
      summary: item.news_intro,
      url: item.news_url_reference,
      createdAt: new Date(item.create_date),
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
      return app.models.NewsArticle.bulkCreate(
        massageLegacyNews(fetched),
        {logging: false}
      )

      .then(function () {
        logger.info(`Successfully imported ${fetched.length} items`);
      });
    });
};
