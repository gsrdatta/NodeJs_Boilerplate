const nodemailer = require('nodemailer');
const Promise = require('bluebird')

module.exports = function (mailOptions) {
    mailOptions.from = process.env.MAIL_FROM;
    return new Promise(function (resolve, reject) {
        //get THEM from DB
        var smtpTransport = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: process.env.MAIL_PORT,
            auth: {
                user: process.env.MAIL_USERNAME,
                pass: process.env.MAIL_PASSWORD
            }
        });

        // send mail with defined transport object
        smtpTransport.sendMail(mailOptions, function (error, info) {
            if (error) {
               reject(error);
            }
            resolve(info);
        });
    })
}
