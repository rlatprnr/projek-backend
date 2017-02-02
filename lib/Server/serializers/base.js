import _ from 'lodash';
import {Serializer as JSONAPISerializer} from 'jsonapi-serializer';
import inflector from 'inflected';

export function relateToOneId (key, data) {
  const idKey = `${key}Id`;
  let _data = data;

  if (_data.id) {
    _data = [_data];
  }

  _data = _data.map(function (item) {
    if (item[idKey]) {
      item[key] = {id: item[idKey]};
    }
    return item;
  });

  if (data.id) { _data = _data[0]; }

  return _data;
}

export default function (type, data, opts = {}) {
  return new JSONAPISerializer(type, data, _.assign({
    keyForAttribute: 'camelCase',
    typeForAttribute: function (attr) {
      return inflector.pluralize(
        inflector.camelize(attr, false)
      );
    }
  }, opts));
}
