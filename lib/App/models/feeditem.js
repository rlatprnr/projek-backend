'use strict';

module.exports = function (sequelize, DataTypes) {
  const FeedItem = sequelize.define('FeedItem', {
    feedable: DataTypes.STRING,
    feedableId: DataTypes.INTEGER
  }, {
    instanceMethods: {
      setFeedable: function (item) {
        const id = item.id;
        const name = item.Model.name;
        this.feedableId = id;
        this.feedable = name;
      }
    },
    classMethods: {
      associate: function (models) {
        const feedables = [
          models.Update,
          models.NewsArticle,
          models.Quote,
          models.Event
        ];

        feedables.forEach(function (model) {
          models.FeedItem.belongsTo(model, {
            foreignKey: 'feedableId',
            constraints: false,
            as: model.name
          });
        });
      }
    }
  });

  return FeedItem;
};
