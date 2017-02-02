import serializer, {relateToOneId} from './base';

export default function (data) {
  let _data = relateToOneId('User', data);

  return serializer('verifications', _data, {
    attributes: [
      'label',
      'User'
    ],
    User: {
      ref: 'id',
      included: false,
      attributes: []
    }
  });
}
