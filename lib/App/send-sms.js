import md5 from 'md5';
import request from 'superagent';
import {
  SMS_USER,
  SMS_PASS
} from './config';

const url = 'http://send.smsmasking.co.id:8080/web2sms/api/sendSMS.aspx';

function auth (...args) {
  return args.join('');
}

function format (v) {
  return v.replace('+', '');
}

export default function sendSMS ({to, message}) {
  return new Promise(function (resolve, reject) {
    request
      .get(url)
      .query({
        username: SMS_USER,
        mobile: format(to),
        message,
        auth: md5(auth(SMS_USER, SMS_PASS, format(to)))
      })
      .end(function (err, res) {
        if (err) { return reject(err); }

        if (res.text.length <= 4) {
          reject(`unable to send sms to ${to}`);
        } else {
          resolve();
        }
      });
  });
}
