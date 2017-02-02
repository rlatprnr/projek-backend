'use strict';

import userVerification from './models/user-verification';
import user from './models/user';
import agent from './models/agent';

export default function test ({app}) {
  userVerification({app});
  user({app});
  agent({app});
}
