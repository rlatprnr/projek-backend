import serializer from './base';

export default function (data) {
  return serializer('bearerTokens', data, {
    attributes: [
      'expires'
    ]
  });
}
