import Promise from 'bluebird';

module.exports = function (app) {
  const logger = app.logger;

  function seedItems (items) {
    logger.info(`seeding items for type ${items[0].Model.name}`);
    return Promise.each(items, function (item) {
      logger.info(`seeding ${item.Model.name} ${item.id}`);

      let feedItem = app.models.FeedItem.build({
        createdAt: item.createdAt
      });

      feedItem.setFeedable(item);

      return feedItem.save();
    });
  }

  return Promise.all([
    app.models.Quote.findAll(),
    app.models.Update.findAll(),
    app.models.NewsArticle.findAll()
  ])

  .then(function (results) {
    return Promise.each(results, seedItems);
  })

  .then(function () {
    logger.info(`Successfully seeded feed`);
  })

  .catchThrow();
};
