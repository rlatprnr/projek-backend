import serializer from './base';

export default function (data) {
  return serializer('quotes', data, {
    attributes: [
      'quote',
      'authorName',
      'authorTitle',
      'authorImgUrl',
      'createdAt',
      'Roles'
    ],
    Roles: {
      ref: 'id',
      attributes: ['name']
    }
  });
}
