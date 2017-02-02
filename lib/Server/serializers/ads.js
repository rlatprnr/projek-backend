import serializer from './base';

export default function (data) {
  return serializer('ads', data, {
    attributes: [
      'imgUrl',
      'destUrl',
      'imgWidth',
      'imgHeight'
    ]
  });
}
