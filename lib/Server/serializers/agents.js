import serializer, {relateToOneId} from './base';

export default function (data) {
  let _data = relateToOneId('User', data);

  return serializer('agents', _data, {
    attributes: [
      'govId',
      'companyName',
      'officeName',
      'officeAddress',
      'officeCity',
      'officeProvince',
      'officePhone',
      'createdAt',
      'User'
    ],
    User: {
      ref: 'id',
      included: false,
      attributes: []
    }
  });
}
