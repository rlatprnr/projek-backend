import serializer, {relateToOneId} from './base';

export default function (data) {
  let _data = relateToOneId('Agent', data);

  return serializer('users', _data, {
    attributes: [
      'firstName',
      'lastName',
      'email',
      'Agent',
      'Roles'
    ],
    Agent: {
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
