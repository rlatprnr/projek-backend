import serializer from './base';

export default function (data) {
  return serializer('events', data, {
    attributes: [
      'name',
      'description',
      'location',
      'url',
      'publicUrl',
      'fromDate',
      'toDate',
      'attendeesCount',
      'maxAttendees',
      'myAttendance',
      'coverImgUrl',
      'registrationFormUrl'
    ]
  });
}
