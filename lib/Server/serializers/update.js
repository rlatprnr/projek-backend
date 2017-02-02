import serializer, {relateToOneId} from './base';

export default function (data) {
  let _data = relateToOneId('Project', data);

  return serializer('updates', _data, {
    attributes: [
      'body',
      'createdAt',
      'summary',
      'Project',
      'Roles'
    ],
    Project: {
      ref: 'id',
      included: false,
      attributes: []
    },
    Roles: {
      ref: 'id',
      attributes: ['name']
    }
  });
}
