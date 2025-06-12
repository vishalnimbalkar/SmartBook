const nodemailer = require('nodemailer');
const ejs = require('ejs');

const transporter = nodemailer.createTransport({
	host: process.env.EMAIL_HOST,
	port: process.env.EMAIL_PORT,
	secure: false,
	auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

/**
 * function sends email
 * @param {string} to - recievers email
 * @param {string} name - customer name
 * @param {string} verificationToken - token for email verification
 * @returns
 */
const sendVerificationEmail = async (to, name, verificationToken) => {
	//verification api with jwt token
	const verificationUrl = `http://localhost:3000/user/verify?verificationToken=${verificationToken}`;
	const ejsTemplate = await ejs.renderFile('./utilities/templates/email.ejs', { name, verificationUrl });
	const mailOptions = {
		from: process.env.EMAIL_USER,
		to,
		subject: 'Account Created Successfully!',
		html: ejsTemplate,

		// Attachments for email
		attachments: [
			{ filename: 'logo.png', path: './utilities/images/logo.png', cid: 'logo', contentDisposition: 'inline' },
		],
	};
	return transporter.sendMail(mailOptions);
};

const forgotPasswordEmail = async (verificationToken, to, name) => {
	//verification api with jwt token
	const resetUrl = `http://localhost:3000/user/reset-password?verificationToken=${verificationToken}`;
	const ejsTemplate = await ejs.renderFile('./utilities/templates/forgotPassword.ejs', { name, resetUrl });
	const mailOptions = {
		from: process.env.EMAIL_USER,
		to,
		subject: 'Reset Password',
		html: ejsTemplate,

		// Attachments for email
		attachments: [
			{ filename: 'logo.png', path: './utilities/images/logo.png', cid: 'logo', contentDisposition: 'inline' },
		],
	};
	return transporter.sendMail(mailOptions);
};
module.exports = { sendVerificationEmail, forgotPasswordEmail };
