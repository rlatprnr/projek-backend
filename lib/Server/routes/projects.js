'use strict';

import _ from 'lodash';
import express from 'express';
import Promise from 'bluebird';
import validateReq from 'express-validation';
import {authenticateIfAuth} from '../auth';
import * as validators from '../request-validators';
import serializeUpdate from '../serializers/update';
import serializeProject from '../serializers/project';
import createError from 'http-errors';
import {extractRolesFromReq} from '../util';

function router (app, logger) {
  const includeQuery = [
    app.models.Attachment,
    app.models.Update,
    app.models.ProjectItem
  ];

  function assertFound (result, id, model = 'Project') {
    if (!result) {
      throw createError(404, `couldn't find ${model}`, {id});
    }
  }

  function createOrUpdate (name, records) {
    return records.map(function (record) {
      let action;

      if (record.data.id) {
        action = app.models[name].findById(record.data.id)
          .then(function (result) {
            assertFound(result, record.data.id, name);
            return result.update(record.data.attributes);
          });
      } else {
        action = app.models[name].create(
          record.data.attributes
        );
      }

      return action.then(function (result) {
        return result.findAndSetRoles(extractRolesFromReq(record));
      });
    });
  }

  function getProject (req, res, next) {
    app.models.Project.findById(
      req.params.id,
      {
        include: includeQuery,
        order: [
          [app.models.Update, 'createdAt', 'DESC']
        ]
      }
    )

    .then(function (result) {
      assertFound(result, req.params.id);
      res.json(serializeProject(result.toJSON()));
    })

    .catch(next);
  }

  function getProjects (req, res, next) {
    const page = req.query.page || {};
    const limit = parseInt((page.limit || 10), 10);
    const offset = parseInt((page.offset || 0), 10);

    let filter = req.query.filter || {};
    filter = _.pick(filter, 'featured');

    app.models.Project.findAll({
      order: [
        ['createdAt', 'DESC']
      ],
      where: filter,
      limit,
      offset
    })

    .then(function (results) {
      res.json(
        serializeProject(results.map((r) => r.toJSON()))
      );
    })

    .catch(next);
  }

  function postProject (req, res, next) {
    const attrs = req.body.data.attributes;
    const attachments = req.body.data.attachments || [];
    const items = req.body.data.projectItems || [];

    const createProject = app.models.Project.create(Object.assign(attrs, {
      Updates: []
    }), {
      include: includeQuery
    });
    const createAttachments = Promise.all(createOrUpdate('Attachment', attachments));
    const createItems = Promise.all(createOrUpdate('ProjectItem', items));

    return Promise.join(createProject, createAttachments, createItems,
      function (project, attachments, items) {
        return Promise.all([
          project.setAttachments(attachments),
          project.setProjectItems(items)
        ]).then(function () {
          return project.findAndSetRoles(extractRolesFromReq(req.body));
        });
      })

      .then(function (result) {
        res.status(201).json(serializeProject(result.toJSON()));
      })

      .catch(next);
  }

  function patchProject (req, res, next) {
    const id = req.params.id;
    const attrs = req.body.data.attributes || {};
    const attachments = req.body.data.attachments || [];
    const items = req.body.data.projectItems || [];

    app.models.Project.findById(id, {
      include: includeQuery,
      order: [
        [app.models.Update, 'createdAt', 'DESC']
      ]
    })

    .then(function (result) {
      assertFound(result, id);

      const updateProject = result.update(attrs);
      const updateAttachments = Promise.all(createOrUpdate('Attachment', attachments));
      const updateItems = Promise.all(createOrUpdate('ProjectItem', items));

      return Promise.join(updateProject, updateAttachments, updateItems,
        function (updated, updatedAttachments, updatedItems) {
          return Promise.all([
            result.setAttachments(updatedAttachments),
            result.setProjectItems(updatedItems)
          ]);
        })

        .then(function () {
          return result.findAndSetRoles(extractRolesFromReq(req.body));
        })

        .then(function (updated) {
          res.json(serializeProject(updated.toJSON()));
        });
    })

    .catch(next);
  }

  function deleteProject (req, res, next) {
    app.models.Project.destroy({
      where: {
        id: req.params.id
      }
    })

    .then(function () {
      res.status(204).end();
    })

    .catch(next);
  }

  function postUpdate (req, res, next) {
    const attrs = req.body.data.attributes;
    const projectId = req.params.id;

    app.models.Project.findById(projectId)
      .then(function (project) {
        assertFound(project, projectId);

        let u = app.models.Update.build(attrs);
        u.setProject(project, {save: false});

        return u.save();
      })

      .then(function (update) {
        setImmediate(function () {
          app.worker.publish(app.worker.PUBLISH_FEEDABLE, {
            modelName: app.models.Update.name,
            id: update.id
          });
        });

        res.status(201).json(serializeUpdate(update.toJSON()));
      })

      .catch(next);
  }

  return express.Router()
    .get('/projects', validateReq(validators.getProjects), authenticateIfAuth(), getProjects)
    .post('/projects', validateReq(validators.postProject), authenticateIfAuth(), postProject)
    .get('/projects/:id', validateReq(validators.getItem), authenticateIfAuth(), getProject)
    .patch('/projects/:id', validateReq(validators.patchProject), authenticateIfAuth(), patchProject)
    .delete('/projects/:id', validateReq(validators.deleteObject), authenticateIfAuth(), deleteProject)
    .post('/projects/:id/updates', validateReq(validators.postProjectUpdate), authenticateIfAuth(), postUpdate);
}

export default router;
