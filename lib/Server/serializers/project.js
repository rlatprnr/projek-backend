import _ from 'lodash';
import serializer from './base';

// Older api consumers expect relationship attrs to be directly
// within the relationships key
function legacyWrapper (jsonAPIData) {
  let _data = jsonAPIData.data;

  function config (resource) {
    const setter = function (item) {
      let includedItem = _.find(jsonAPIData.included, {
        type: item.type,
        id: item.id
      });

      let attributes = includedItem.attributes || {};
      item.attributes = attributes;
      return item;
    };

    if (resource.relationships.updates != null) {
      resource.relationships.updates.data =
        resource.relationships.updates.data.map(setter);
    }

    if (resource.relationships.attachments) {
      resource.relationships.attachments.data =
        resource.relationships.attachments.data.map(setter);
    }
  }

  if (_data.id) {
    config(_data);
  } else {
    _data.forEach(config);
  }

  return jsonAPIData;
}

export default function (data) {
  let jsonAPIData = serializer('projects', data, {
    attributes: [
      'title',
      'body',
      'coverImgUrl',
      'coverVideoUrl',
      'featured',
      'createdAt',
      'ProjectItems',
      'Updates',
      'Attachments',
      'Roles'
    ],
    ProjectItems: {
      ref: 'id',
      attributes: ['title', 'remoteUrl', 'body', 'sort', 'createdAt', 'Roles'],
      Roles: {
        ref: 'id',
        attributes: ['name']
      }
    },
    Attachments: {
      ref: 'id',
      attributes: ['name', 'url', 'createdAt', 'Roles'],
      Roles: {
        ref: 'id',
        attributes: ['name']
      }
    },
    Updates: {
      ref: 'id',
      attributes: ['summary', 'body', 'createdAt', 'Roles'],
      Roles: {
        ref: 'id',
        attributes: ['name']
      }
    },
    Roles: {
      ref: 'id',
      attributes: ['name']
    }
  });

  // FIXME: remove after android v0.1.4 is no longer used
  return legacyWrapper(jsonAPIData);
}
