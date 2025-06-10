const nodemailer = require('nodemailer');
const ejs = require('ejs');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

const sendEmail = async (to, name, verificationToken) => {


    const verificationUrl = `http://localhost:3000/user/verify?verification_token=${verificationToken}`;

    const ejsTemplate = await ejs.renderFile('./templates/email.ejs', {
        name,
        verificationUrl,
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject: 'Account Created Successfully!',
        html: ejsTemplate,

        // Attachments for email
        // attachments: [
        //     {
        //         filename: 'logo.png',
        //         path: './images/logo.png',
        //         cid: 'logo',
        //         contentDisposition: 'inline',
        //     }
        // ],
    };
    return transporter.sendMail(mailOptions);
};

module.exports = { sendEmail };
