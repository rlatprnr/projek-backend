import {defaults, sample} from 'lodash';
import faker from 'faker';

function address () {
  return `${faker.address.streetAddress()}, ${faker.address.zipCode()}`;
}

export function phone () {
  return faker.phone.phoneNumber('+62 8## ### ####');
}

export function newsArticle (merge = {}) {
  return defaults(merge, {
    body: faker.lorem.paragraphs(2),
    coverImgUrl: faker.image.imageUrl(),
    title: faker.lorem.sentence(),
    summary: faker.lorem.sentences(2)
  });
}

export function project (merge = {}) {
  return defaults(merge, {
    body: faker.lorem.paragraphs(2),
    coverImgUrl: faker.image.imageUrl(),
    coverVideoUrl: faker.internet.url(),
    title: faker.lorem.sentence()
  });
}

export function update (merge = {}) {
  return defaults(merge, {
    body: faker.lorem.paragraphs(2),
    summary: faker.lorem.sentences(2)
  });
}

export function pushDevice (merge = {}) {
  return defaults(merge, {
    registrationId: faker.random.uuid(),
    platform: sample(['ios', 'android'])
  });
}

export function quote (merge = {}) {
  return defaults(merge, {
    quote: faker.lorem.sentences(2),
    authorName: `${faker.name.firstName()} ${faker.name.lastName()}`,
    authorTitle: faker.name.jobTitle(),
    authorImgUrl: faker.internet.url()
  });
}

export function user (merge = {}) {
  return defaults(merge, {
    email: faker.internet.email(),
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    phone: faker.phone.phoneNumber('+62 8## ### ####')
  });
}

export function userVerification (merge = {}) {
  return defaults(merge, {
    label: sample(['phone', 'email'])
  });
}

export function agent (merge = {}) {
  return defaults(merge, {
    govId: faker.random.number().toString(),
    companyName: sample([null, faker.company.companyName()]),
    officeName: sample([null, faker.company.companyName()]),
    officeAddress: sample([null, address()]),
    officeCity: sample([null, faker.address.city()]),
    officeProvince: sample([null, faker.address.stateAbbr()]),
    officePhone: sample([null, phone()])
  });
}
