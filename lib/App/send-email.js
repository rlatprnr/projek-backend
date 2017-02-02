import Promise from 'bluebird';
import mailer from 'nodemailer';
import {
  SMTP_HOST,
  SMTP_USER,
  SMTP_PASS
} from './config';

const transporter = mailer.createTransport({
  host: SMTP_HOST,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  },
  secure: true
});

export default function sendEmail ({to, subject, body}) {
  return new Promise(function (resolve, reject) {
    transporter.sendMail({
      from: 'no-reply@projek.asia',
      text: body,
      to,
      subject
    }, function (err, result) {
      if (err) { return reject(err); }
      resolve(result);
    });
  });
}
