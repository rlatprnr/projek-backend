import serializer, {relateToOneId} from './base';

export default function (data) {
  let _data = relateToOneId('Project', data);

  return serializer('projectItems', _data, {
    attributes: [
      'title',
      'remoteUrl',
      'body',
      'sort',
      'createdAt',
      'Roles',
      'Project'
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
