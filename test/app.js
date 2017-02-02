'use strict';

import worker from './app/worker';
import queue from './app/queue';
import jobs from './app/jobs';
import models from './app/models';

export default function appTest ({app}) {
  worker({app});
  queue({app});
  jobs({app});
  models({app});
}
