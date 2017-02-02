export default function push ({modelName, id}, app) {
  if (!modelName) { throw new Error('"data.type" required'); }
  if (!id) { throw new Error('"data.id" required'); }
  if (!app) { throw new Error('"app" required'); }
  if (!app.models[modelName]) { throw new Error(`${modelName} is not a valid model`); }

  const logger = app.logger;

  return app.models[modelName].findById(id).then(function (feedable) {
    if (!feedable) { throw new Error(`Unable to find ${modelName} with id ${id}`); }
    let feedItem = app.models.FeedItem.build();
    feedItem.setFeedable(feedable);
    return feedItem.save();
  })

  .then(function () {
    logger.info(`FeedItem successfully created for model ${modelName} with id ${id}`);
  })

  .catch(logger.error);
}
