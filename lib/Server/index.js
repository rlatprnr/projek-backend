'use strict';

import stampit from 'stampit';
import express from 'express';
import json from 'express-json';
import cors from 'cors';
import bodyParser from 'body-parser';
import passport from 'passport';
import auth from './auth';
import adminRouter from './routes/admin';
import projectsRouter from './routes/projects';
import updatesRouter from './routes/updates';
import newsRouter from './routes/news';
import attachmentsRouter from './routes/attachments';
import projectItemsRouter from './routes/project-items';
import pushDevicesRouter from './routes/push-devices';
import notificationsRouter from './routes/notifications';
import quotesRouter from './routes/quotes';
import feedRouter from './routes/feed';
import eventsRouter from './routes/events';
import eventAttendeeRouter from './routes/eventattendees';
import usersRouter from './routes/users';
import verificationsRouter from './routes/verifications';
import agentsRouter from './routes/agents';
import adsRouter from './routes/ads';
import apiError from './api-error';

function configError (missing) {
  throw new Error(`${missing} required`);
}

function Server () {
  this.app || configError('app instance');
  this.logger || configError('logger instance');

  passport.use(auth(this.app));

  const server = express();

  // Legacy clients aren't using jsonapi.org media type
  server.use(bodyParser.json({
    type: ['json', 'application/*+json']
  }));

  server.use(json());
  server.use(cors());
  server.use(this.logger.requestLogger());
  server.use(adminRouter(this.app, this.logger));
  server.use(projectsRouter(this.app, this.logger));
  server.use(updatesRouter(this.app, this.logger));
  server.use(newsRouter(this.app, this.logger));
  server.use(pushDevicesRouter(this.app, this.logger));
  server.use(notificationsRouter(this.app, this.logger));
  server.use(quotesRouter(this.app, this.logger));
  server.use(feedRouter(this.app, this.logger));
  server.use(eventsRouter(this.app, this.logger));
  server.use(eventAttendeeRouter(this.app, this.logger));
  server.use(usersRouter(this.app, this.logger));
  server.use(verificationsRouter(this.app, this.logger));
  server.use(agentsRouter(this.app, this.logger));
  server.use(adsRouter(this.app, this.logger));
  server.use(attachmentsRouter(this.app, this.logger));
  server.use(projectItemsRouter(this.app, this.logger));

  server.use(apiError());
  server.use(this.logger.errorLogger());
  server.use((err, req, res, next) => {
    const json = {message: err.message, name: err.name};
    if (err.expose) { json.error = err; }
    res.status(err.status).json(json);
  });

  return server;
}

export default stampit({init: Server});
