'use strict';

import Joi from 'joi';
import { options as globalOptions } from 'express-validation';

function id (required = true) {
  let cond = Joi.number()
    .integer()
    .positive();

  if (required) {
    cond = cond.required();
  }

  return cond;
}

function optional (cond) {
  return cond.optional().allow(null).empty(['null', '']);
}

function authorization (required = true) {
  let cond = optional(Joi.string().regex(/Bearer|Basic/));

  if (required) {
    cond = cond.required();
  }

  return {authorization: cond};
}

const roles = Joi.array().items(
  Joi.object().keys({
    data: Joi.object().keys({
      id: id(false),
      type: Joi.string().required().equal('roles'),
      attributes: Joi.object().keys({
        name: Joi.string().required()
      })
    })
  })
);

const pageQuery = Joi.object().keys({
  limit: Joi.number().integer(),
  offset: Joi.number().integer()
});

globalOptions({
  flatten: true
});

export const getProjects = {
  headers: authorization(false),
  query: {
    filter: Joi.object().keys({
      featured: Joi.boolean().optional()
    }),
    page: pageQuery
  }
};

export const patchProjectItem = {
  headers: authorization(false),
  params: {
    id: id()
  },
  body: {
    data: Joi.object().required().keys({
      type: Joi.string().required().equal('projectItems'),
      id: id(),
      roles,
      attributes: Joi.object().keys({
        title: Joi.string().required(),
        remoteUrl: optional(Joi.string().uri()),
        body: optional(Joi.string()),
        sort: optional(Joi.number())
      })
    })
  },
  options: {
    allowUnknownParams: false,
    allowUnknownBody: false
  }
};

export const patchAttachment = {
  headers: authorization(false),
  params: {
    id: id()
  },
  body: {
    data: Joi.object().required().keys({
      type: Joi.string().required().equal('attachments'),
      id: id(),
      roles,
      attributes: Joi.object().keys({
        url: Joi.string().uri().required(),
        name: Joi.string().required()
      })
    })
  },
  options: {
    allowUnknownParams: false,
    allowUnknownBody: false
  }
};

export const postProject = {
  headers: authorization(false),
  body: {
    data: Joi.object().required().keys({
      type: Joi.string().required().equal('projects'),
      attributes: Joi.object().keys({
        title: Joi.string().required(),
        body: Joi.string().required(),
        coverImgUrl: Joi.string().required().uri(),
        coverVideoUrl: optional(Joi.string().uri()),
        featured: Joi.boolean().optional()
      }),
      roles,
      projectItems: Joi.array().items(
        Joi.object().keys({
          data: Joi.object().keys({
            type: Joi.string().required().equal('projectItems'),
            roles,
            attributes: Joi.object().keys({
              title: Joi.string().required(),
              remoteUrl: optional(Joi.string().uri()),
              body: optional(Joi.string()),
              sort: optional(Joi.number())
            })
          })
        })
      ),
      attachments: Joi.array().items(
        Joi.object().keys({
          data: Joi.object().keys({
            id: id(false),
            type: Joi.string().required().equal('attachments'),
            roles,
            attributes: Joi.object().keys({
              url: Joi.string().uri().required(),
              name: Joi.string().required()
            })
          })
        })
      )
    })
  },
  options: {
    allowUnknownBody: false
  }
};

export const patchProject = {
  headers: authorization(false),
  params: {
    id: id()
  },
  body: {
    data: Joi.object().required().keys({
      type: Joi.string().required().equal('projects'),
      id: id(),
      attributes: Joi.object().keys({
        title: Joi.string(),
        body: Joi.string(),
        coverImgUrl: Joi.string().uri(),
        coverVideoUrl: optional(Joi.string().uri()),
        featured: optional(Joi.boolean())
      }),
      roles,
      projectItems: Joi.array().items(
        Joi.object().keys({
          data: Joi.object().keys({
            id: id(false),
            type: Joi.string().required().equal('projectItems'),
            roles,
            attributes: Joi.object().keys({
              title: Joi.string().required(),
              remoteUrl: optional(Joi.string().uri()),
              body: optional(Joi.string()),
              sort: optional(Joi.number())
            })
          })
        })
      ),
      attachments: Joi.array().items(
        Joi.object().keys({
          data: Joi.object().keys({
            id: id(false),
            type: Joi.string().required().equal('attachments'),
            roles,
            attributes: Joi.object().keys({
              url: Joi.string().uri().required(),
              name: Joi.string().required()
            })
          })
        })
      )
    })
  },
  options: {
    allowUnknownParams: false,
    allowUnknownBody: false
  }
};

export const getUpdates = {
  headers: authorization(false),
  query: {
    page: pageQuery
  }
};

const postUpdateBody = {
  headers: authorization(false),
  data: Joi.object().required().keys({
    type: Joi.string().required().equal('updates'),
    roles,
    attributes: Joi.object().keys({
      body: optional(Joi.string()),
      summary: Joi.string().required()
    })
  })
};

export const postProjectUpdate = {
  headers: authorization(false),
  params: {
    id: id()
  },
  body: postUpdateBody,
  options: {
    allowUnknownParams: false,
    allowUnknownBody: false
  }
};

export const postUpdate = {
  headers: authorization(false),
  body: postUpdateBody,
  options: {
    allowUnknownParams: false,
    allowUnknownBody: false
  }
};

export const patchUpdate = {
  headers: authorization(false),
  params: {
    id: id()
  },
  body: {
    data: Joi.object().required().keys({
      type: Joi.string().required().equal('updates'),
      id: id(),
      roles,
      attributes: Joi.object().keys({
        body: optional(Joi.string()),
        summary: Joi.string()
      })
    })
  },
  options: {
    allowUnknownParams: false,
    allowUnknownBody: false
  }
};

export const getNews = {
  headers: authorization(false),
  query: {
    page: pageQuery
  }
};

export const postNews = {
  headers: authorization(false),
  body: {
    data: Joi.object().required().keys({
      type: Joi.string().required().equal('news'),
      roles,
      attributes: Joi.object().required().keys({
        body: Joi.string().required(),
        summary: Joi.string().required(),
        title: Joi.string().required(),
        url: optional(Joi.string().uri()),
        coverImgUrl: Joi.string().uri().required()
      })
    })
  },
  options: {
    allowUnknownBody: false
  }
};

export const patchNews = {
  headers: authorization(false),
  body: {
    data: Joi.object().required().keys({
      id: id(),
      type: Joi.string().required().equal('news'),
      roles,
      attributes: Joi.object().required().keys({
        body: Joi.string(),
        summary: Joi.string(),
        title: Joi.string(),
        url: optional(Joi.string().uri()),
        coverImgUrl: Joi.string().uri()
      })
    })
  },
  options: {
    allowUnknownBody: false
  }
};

export const pushDevices = {
  headers: authorization(false),
  body: {
    data: Joi.object().required().keys({
      type: Joi.string().required().equal('push_devices'),
      attributes: Joi.object().required().keys({
        registrationId: Joi.string().required(),
        platform: Joi.string().allow(['ios', 'android']).default('android', 'default platform')
      })
    })
  },
  options: {
    allowUnknownBody: false
  }
};

export const deleteObject = {
  headers: authorization(false),
  params: {
    id: id()
  },
  options: {
    allowUnknownParams: false
  }
};

export const notifications = {
  headers: authorization(false),
  body: {
    data: Joi.object().required().keys({
      type: Joi.string().required().equal('notifications'),
      attributes: Joi.object().required().keys({
        contentType: Joi.string().required(),
        contentId: Joi.number().integer().required()
      })
    })
  },
  options: {
    allowUnknownBody: false
  }
};

export const getItem = {
  headers: authorization(false),
  params: {
    id: id()
  },
  options: {
    allowUnknownParams: false
  }
};

export const getMe = {
  headers: authorization()
};

export const getQuotes = {
  headers: authorization(false),
  query: {
    page: pageQuery
  }
};

export const postQuotes = {
  headers: authorization(false),
  body: {
    data: Joi.object().required().keys({
      type: Joi.string().required().equal('quotes'),
      roles,
      attributes: Joi.object().required().keys({
        quote: Joi.string().required(),
        authorName: Joi.string().required(),
        authorTitle: Joi.string().required(),
        authorImgUrl: optional(Joi.string().uri())
      })
    })
  },
  options: {
    allowUnknownBody: false
  }
};

export const patchQuote = {
  headers: authorization(false),
  params: {
    id: id()
  },
  body: {
    data: Joi.object().required().keys({
      id: id(),
      type: Joi.string().required().equal('quotes'),
      roles,
      attributes: Joi.object().required().keys({
        quote: Joi.string(),
        authorName: Joi.string(),
        authorTitle: Joi.string(),
        authorImgUrl: optional(Joi.string().uri())
      })
    })
  },
  options: {
    allowUnknownBody: false
  }
};

export const getFeed = {
  headers: authorization(false),
  query: {
    page: pageQuery
  }
};

export const getFeedSummary = {
  headers: authorization()
};

export const getEvent = {
  headers: authorization(),
  params: {id: id()},
  options: {allowUnknownParams: false}
};

export const getEvents = {
  headers: authorization(false),
  query: {
    page: pageQuery
  }
};

export const postEvents = {
  headers: authorization(false),
  body: {
    data: Joi.object().required().keys({
      type: Joi.string().required().equal('events'),
      roles,
      attributes: Joi.object().required().keys({
        name: Joi.string().required(),
        description: Joi.string().required(),
        location: optional(Joi.string()),
        fromDate: Joi.string().required(),
        toDate: Joi.string().required(),
        attendeesCount: optional(Joi.number().integer().min(0)),
        maxAttendees: Joi.number().integer().min(0),
        coverImgUrl: optional(Joi.string().uri()),
        url: optional(Joi.string().uri())
      })
    })
  },
  options: {
    allowUnknownBody: false
  }
};

export const patchEvent = {
  headers: authorization(false),
  params: {
    id: id()
  },
  body: {
    data: Joi.object().required().keys({
      id: id(),
      type: Joi.string().required().equal('events'),
      roles,
      attributes: Joi.object().required().keys({
        name: Joi.string(),
        description: Joi.string(),
        location: optional(Joi.string()),
        fromDate: Joi.string(),
        toDate: Joi.string(),
        attendeesCount: optional(Joi.number().integer().min(0)),
        maxAttendees: Joi.number().integer().min(0),
        coverImgUrl: optional(Joi.string().uri()),
        url: optional(Joi.string().uri())
      })
    })
  },
  options: {
    allowUnknownBody: false
  }
};

export const downloadEventRegistrationForm = {
  headers: authorization(false)
};

export const getAds = {
  headers: authorization(false),
  query: {
    page: pageQuery
  }
};

export const getAttendee = {
  headers: authorization(),
  params: {id: id()},
  options: {allowUnknownParams: false}
};

export const putAttendee = {
  headers: authorization(),
  body: {
    data: Joi.object().required().keys({
      userId: id(),
      eventId: id(),
      registrationData: Joi.string()
    })
  },
  options: {
    allowUnknownBody: false
  }
};

export const postUsers = {
  body: {
    data: Joi.object().required().keys({
      type: Joi.string().required().equal('users'),
      attributes: Joi.object().required().keys({
        email: Joi.string().email().required(),
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        phone: Joi.string().required()
      })
    })
  },
  options: {
    allowUnknownBody: false
  }
};

export const postVerifications = {
  body: {
    data: Joi.object().required().keys({
      type: Joi.string().required().equal('verifications'),
      attributes: Joi.object().required().keys({
        label: Joi.string().required().only(['phone', 'email']),
        value: Joi.string().required()
      })
    })
  },
  options: {
    allowUnknownBody: false
  }
};

export const putVerifications = {
  params: {
    id: id()
  },
  body: {
    data: Joi.object().required().keys({
      id: id(),
      type: Joi.string().required().equal('verifications'),
      attributes: Joi.object().required().keys({
        token: Joi.string().required()
      })
    })
  },
  options: {
    allowUnknownBody: false,
    allowUnknownParams: false
  }
};

export const getAgent = {
  headers: authorization(),
  params: {id: id()},
  options: {allowUnknownParams: false}
};

export const postAgents = {
  headers: authorization(),
  params: {
    id: id()
  },
  body: {
    data: Joi.object().required().keys({
      type: Joi.string().required().equal('agents'),
      attributes: Joi.object().required().keys({
        govId: Joi.number().required(),
        companyName: optional(Joi.string()),
        officeName: optional(Joi.string()),
        officeAddress: optional(Joi.string()),
        officeCity: optional(Joi.string()),
        officeProvince: optional(Joi.string()),
        officePhone: optional(Joi.string())
      })
    })
  },
  options: {
    allowUnknownBody: false
  }
};

export const patchAgents = {
  headers: authorization(),
  params: {
    id: id()
  },
  body: {
    data: Joi.object().required().keys({
      id: id(),
      type: Joi.string().required().equal('agents'),
      attributes: Joi.object().required().keys({
        govId: optional(Joi.number()),
        companyName: optional(Joi.string()),
        officeName: optional(Joi.string()),
        officeAddress: optional(Joi.string()),
        officeCity: optional(Joi.string()),
        officeProvince: optional(Joi.string()),
        officePhone: optional(Joi.string())
      })
    })
  },
  options: {
    allowUnknownBody: false
  }
};
