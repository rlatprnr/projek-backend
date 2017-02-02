import serializer from './base';

export default function (data) {
  return serializer('news', data, {
    attributes: [
      'body',
      'createdAt',
      'title',
      'summary',
      'url',
      'coverImgUrl',
      'Roles'
    ],
    Roles: {
      ref: 'id',
      attributes: ['name']
    }
  });
}
