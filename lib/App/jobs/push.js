import _ from 'lodash';
import Promise from 'bluebird';
import gcm from 'node-gcm';
import apn from 'apn';

export default function push ({type, id}, app) {
  if (!type) { throw new Error('"data.type" required'); }
  if (!id) { throw new Error('"data.id" required'); }
  if (!app) { throw new Error('"app" required'); }

  const logger = app.logger;

  function incrementUnread () {
    return app.models.PushDevice.update({
      unread: app.db.literal('unread +1')
    }, {
      where: {}
    })

    .then(function (updatedCount) {
      logger.info(`incremented "unread" count for ${updatedCount} devices`);
    });
  }

  function sendApn (data) {
    logger.info('initializing APN notification request', data);

    return app.models.PushDevice.findAll({
      where: {
        platform: 'ios',
        registrationId: {
          $ne: null
        }
      }
    }).each(function (result) {
      let note = new apn.Notification(_.pick(data, 'metadata'));

      note.contentAvailable = true;
      note.alert = data.title;
      note.sound = 'default';
      note.badge = result.unread;
      app.apnConnection.pushNotification(note, result.registrationId);
    });
  }

  function sendGcm (data) {
    logger.info('initializing GCM notification request', data);

    let defaults = {
      image: 'icon'
    };

    return app.models.PushDevice.findAll({
      where: {
        platform: 'android',
        registrationId: {
          $ne: null
        }
      }
    }).then(function (results) {
      let regIds = results.map((r) => r.registrationId);
      regIds = _.uniq(regIds);

      if (regIds.length === 0) {
        logger.warn('Found no android devices to send push notification to', data);
        return;
      }

      let msg = new gcm.Message({data: _.extend(defaults, data)});
      let sender = app.gcmSender;

      function batch (ids) {
        return new Promise(function (resolve, reject) {
          sender.send(msg, {registrationTokens: ids}, function (err, response) {
            if (err) {
              reject(err);
              return;
            }

            logger.info('GCM notification request processed', response, data);
            resolve();
          });
        });
      }

      return Promise.all(_.map(_.chunk(regIds, 1000), batch));
    });
  }

  function send (data) {
    logger.info('initializing notification request', data);

    return Promise.resolve()
      .then(incrementUnread)

      .then(function () {
        return Promise.join(sendApn(data), sendGcm(data));
      })

      .then(function () {
        logger.info('notification request fully processed', data);
      })

      .catch(function (...args) {
        logger.error('GCM notification request error', ...args);
      });
  }

  function news () {
    return app.models.NewsArticle.findById(id).then(function (result) {
      if (!result) {
        throw new Error(`Unable to find NewsArticle with id ${id}`);
      }

      return send({
        title: result.title,
        body: result.summary,
        metadata: {type: 'news', id}
      });
    });
  }

  function updates () {
    return app.models.Update.findById(id, {include: [app.models.Project]}).then(function (result) {
      if (!result) {
        throw new Error(`Unable to find Update with id ${id}`);
      }

      let payload = {
        body: result.summary,
        metadata: {
          type: 'updates',
          id
        }
      };

      if (result.ProjectId) {
        payload.metadata.projectId = result.ProjectId;
        payload.title = `A new update for ${result.Project.title}`;
        return send(payload);
      } else {
        return Promise.resolve().then(incrementUnread).then(function () {
          return Promise.join(
            sendApn(_.extend(_.clone(payload), {title: result.summary})),
            sendGcm(_.extend(_.clone(payload), {title: 'Update'}))
          );
        });
      }
    });
  }

  function quotes () {
    return app.models.Quote.findById(id).then(function (result) {
      if (!result) {
        throw new Error(`Unable to find Quote with id ${id}`);
      }

      return send({
        title: `New quote from ${result.authorName}`,
        body: result.quote,
        metadata: {type: 'quotes', id}
      });
    });
  }

  switch (type) {
    case 'news':
      return news();
    case 'updates':
      return updates();
    case 'quotes':
      return quotes();
    default:
      logger.error('unable to process push job', {type, id});
  }
}
