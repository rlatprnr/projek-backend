import sendEmail from '../send-email';
import sendSMS from '../send-sms';

function emailTemplate ({name, token}) {
  return `Hello ${name},

${token} is your Projek verification code.

Sincerely,
Projek`;
}

export default function ({id}, app) {
  if (!id) { throw new Error('"id" required'); }
  if (!app) { throw new Error('"app" required'); }

  return app.models.UserVerification.findById(id, {
    include: [app.models.User]
  }).then(function (result) {
    if (!result) {
      throw new Error(`Couldn\'t find UserVerification with id ${id}`);
    }

    function email () {
      const token = result.currentToken();
      const name = result.User.firstName;

      return sendEmail({
        to: result.User.email,
        subject: 'Projek Verification',
        body: emailTemplate({name, token})
      })

      .then(success)

      .catch(function (err) {
        app.logger.error(err);
      });
    }

    function sms () {
      return sendSMS({
        to: result.User.phone,
        message: `${result.currentToken()} is your Projek verification code`
      })

      .then(success)

      .catch(function (err) {
        app.logger.error(err);
      });
    }

    function success () {
      app.logger.info(`sent verification for id ${result.id}`);
    }

    switch (result.label) {
      case 'email':
        return email();
      case 'phone':
        return sms();
    }
  });
}
