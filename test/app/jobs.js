'use strict';

import push from './jobs/push';
import publishFeedable from './jobs/publish-feedable';
import sendVerification from './jobs/send-verification';

export default function test ({app}) {
  push({app});
  publishFeedable({app});
  sendVerification({app});
}
