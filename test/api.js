'use strict';

import Server from '../lib/Server';
import news from './api/news';
import projects from './api/projects';
import pushDevices from './api/push-devices';
import notifications from './api/notifications';
import quotes from './api/quotes';
import updates from './api/updates';
import users from './api/users';
import verifications from './api/verifications';
import agents from './api/agents';

export default function apiTest ({app}) {
  const server = Server({app, logger: app.logger});

  news({server, app});
  projects({server, app});
  pushDevices({server, app});
  notifications({server, app});
  quotes({server, app});
  updates({server, app});
  users({server, app});
  verifications({server, app});
  agents({server, app});
}
