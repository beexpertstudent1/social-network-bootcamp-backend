import nodemailer from 'nodemailer';
import config from '../config/config'

const { host, user, pass } = config.email;

/**
 * Creates transporter object that will help us to send emails
 */
const transporter = nodemailer.createTransport({
  host: host,
  secureConnection: true, // use SSL
  port: 465,
  auth: {
    user: user,
    pass: pass,
  },
});

/**
 *  Sends an email to user
 *
 * @param {string} to email address where to send mail
 * @param {string} subject of the email
 * @param {string} html content of the email
 */
export const sendEmail = ({ to, subject, html }) => {
  return new Promise((resolve, reject) => {
    const options = { from: 'BeExpert <no-reply@beexpertonline.com', to, subject, html };

    return transporter
      .sendMail(options)
      .then((response) => {
        resolve(response.data);
      })
      .catch((error) => {
        reject(error);
      });
  });
};
