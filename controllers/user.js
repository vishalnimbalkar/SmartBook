const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { generateToken, emailVerificationToken, forgotPasswordToken } = require('../middlewares/jwt.js');
const jwt = require('jsonwebtoken');
const { sendVerificationEmail, forgotPasswordEmail } = require('../services/email.js');

const registerCustomer = async (req, res) => {
	const connection = await pool.getConnection();
	try {
		const { name, email, password, phone } = req.body;
		// Start transaction
		await connection.beginTransaction();
		//check email is exists or not
		const emailQuery = `select id, email, name, phone, isActive, isVerified, createdAt, updatedAt from mst_users where email = ? LIMIT 1`;
		const [result] = await pool.query(emailQuery, [email]);
		//if result contains user return email already exists
		if (result.length === 1) {
			return res.status(400).json({ success: false, message: 'Email Already Exists' });
		}

		// Hash the password using bcryptjs
		const hashedPassword = await bcrypt.hash(password, 10);

		// Generate email verification token and store email as payload
		const verificationToken = emailVerificationToken({ email });

		//database insert operation
		const userData = [name, email, hashedPassword, phone, verificationToken];
		const query = `insert into mst_users (name, email, password, phone, verificationToken) values(?,?,?,?,?)`;
		await connection.query(query, userData);

		//sending register success mail with email verification link
		await sendVerificationEmail(email, name, verificationToken);

		// If everything succeeds, commit transaction
		await connection.commit();
		connection.release();
		return res.status(200).json({ success: true, message: 'Customer Registed Successfully' });
	} catch (error) {
		await connection.rollback();
		connection.release();
		console.log(error);
		return res.status(500).json({ success: false, message: 'Server side error', error: error.message });
	}
};

/**
 * function to verify user email 
 */
const verifyUser = async (req, res) => {
	const verificationToken = req.query.verificationToken;
	// Virify jwt token and extract user email
	const { email } = jwt.verify(verificationToken, process.env.JWT_VERIFICATION_KEY);
	try {
		const query = `select id, name, isVerified from mst_users where email = ? and verificationToken = ?`;
		const [row] = await pool.query(query, [email, verificationToken]);
		const user = row[0];
		if (!user) {
			return res.render('verifySuccess', {
				success: false,
				message: 'Invalid or expired verification link.',
				loginUrl: 'http://localhost:4200/login',
			});
		}
		//Check user is already verified or not
		if (user.isVerified) {
			return res.render('verifySuccess', {
				success: true,
				name: user.name,
				message: 'Your email has already been verified.',
				loginUrl: 'http://localhost:4200/login',
			});
		}
		// Set verification token null and mark user as verified
		await pool.query(
			`update mst_users set isVerified = 1, verificationToken = null where email = ?`,
			[email]
		);
		// return res.status(200).json({ success: true, message: 'User verified successfully.' });
		return res.render('verifySuccess', { success: true, name: user.name, loginUrl: 'localhot:4200/login' });

	} catch (error) {
		console.log(error);
		return res.render('verifySuccess', {
			success: false,
			message: 'Something went wrong during verification. Please try again later.',
			loginUrl: 'http://localhost:4200/login',
		});
	}
};
/**
 * function to login into account for customer and admin
 */
const login = async (req, res) => {
	try {
		const { email, password } = req.body;
		//Get user by email
		const query = `select id, email, name, password, phone, isActive, isVerified, createdAt, updatedAt from mst_users where email = ? LIMIT 1`;
		const [rows] = await pool.query(query, email);
		//Check if user data is fetched or not
		if (rows.length === 0) {
			return res.status(401).json({ success: false, message: 'Invalid email or password' });
		}

		const user = rows[0];
		//account checks
		if (!user.isActive) {
			return res.status(403).json({ success: false, message: 'Your account is deactivated' });
		}
		if (!user.isVerified) {
			return res.status(403).json({ success: false, message: 'Email is not Verified' });
		}
		//password verification
		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return res.status(401).json({ success: false, message: 'Invalid email or password' });
		}

		// Remove password before sending user data
		delete user.password;
		//Generate access token
		const accessToken = generateToken(user);
		return res.status(200).json({ success: true, message: 'Login successfully', user, accessToken });
	} catch (error) {
		console.log(error);
		return res.status(500).json({ success: false, message: 'Server side error', error: error.message });
	}
};

/**
 * function get user details by id
 */
const getUserDetailsById = async (req, res) => {
	try {
		//get user id from request params
		const userId = req.params.id;
		const query = `select id, email, name, password, phone, isActive, isVerified, createdAt, updatedAt from mst_users where id = ? limit 1`;
		const [row] = await pool.query(query, [userId]);
		//check user find or not if not return 404
		if (row.length === 0) {
			return res.status(404).json({ success: false, message: 'User Not Found' });
		}
		return res.status(200).json({ success: true, message: 'Successfully get User details', user: row[0] });
	} catch (error) {
		console.log(error);
		return res.status(500).json({ success: false, message: 'Server side error', error: error.message });
	}
};

/**
 * function update user details partially
 */
const updateProfile = async (req, res) => {
	try {
		const userId = Number(req.params.id);
		const { name, email, phone } = req.body;
		// Map of fields to be updated
		const fields = { name, email, phone };
		const values = [];
		const fieldsToUpdates = [];

		// Dynamically build query parts for non-undefined fields
		for (const [key, value] of Object.entries(fields)) {
			if (value !== undefined) {
				fieldsToUpdates.push(`${key} = ?`);
				values.push(value);
			}
		}

		// If no valid fields to update
		if (fieldsToUpdates.length === 0) {
			return res.status(400).json({ success: false, message: 'No valid fields provided for update.' });
		}
		// Push user id at the end of the values
		values.push(userId);

		//Query to update user
		const query = `update mst_users set ${fieldsToUpdates.join(', ')} where id = ?`;
		const [result] = await pool.query(query, values);
		//checks user existance and updated or not
		if (result.affectedRows === 0) {
			return res.status(404).json({ success: false, message: 'User not found or no changes made.' });
		}
		return res.status(200).json({ success: true, message: 'User details updated successfully' });
	} catch (error) {
		console.log(error);
		return res.status(500).json({ success: false, message: 'Server side error', error: error.message });
	}
};

/**
 * function delete user by id
 */
const deleteUser = async (req, res) => {
	try {
		const userId = Number(req.params.id);
		const query = `delete from mst_users where id = ?`;
		const [result] = await pool.query(query, [userId]);
		//checks user exists or not
		if (result.affectedRows === 0) {
			return res.status(404).json({ success: false, message: 'User not found' });
		}
		return res.status(200).json({ success: true, message: 'User details deleted successfully' });
	} catch (error) {
		console.log(error);
		return res.status(500).json({ success: false, message: 'Server side error', error: error.message });
	}
};

const forgotPassword = async (req, res) => {
	try {
		const { email } = req.body;
		const query = `select id, email, name, password, phone, isActive, isVerified, createdAt, updatedAt from mst_users where email = ? LIMIT 1`;
		const [row] = await pool.query(query, [email]);
		//checks user exists or not 
		if (row.length === 0) {
			return res.status(400).json({ success: false, message: 'If the email is registered, a reset link will be sent.' });
		}
		const user = row[0];
		const token = jwt.sign({ email }, process.env.JWT_FORGOT_PASSWORD_KEY, { expiresIn: '15m' });
		await forgotPasswordEmail(token, email, user.name);
		return res.status(200).json({ success: true, message: 'If the email is registered, a reset link will be sent.' });
	} catch (error) {
		console.log(error);
		return res.status(500).json({ success: false, message: 'Server side error', error: error.message });
	}
}

const resetPasswordForm = async (req, res) => {
	try {
		const { verificationToken } = req.query;
		jwt.verify(verificationToken, process.env.JWT_FORGOT_PASSWORD_KEY);
		res.render('resetPassword', { success: true, verificationToken });
	} catch {
		res.render('resetPassword', { success: false });
	}
};

const resetPassword = async (req, res) => {
	try {
		const { verificationToken } = req.query;
		const { password } = req.body;
		const { email } = jwt.verify(verificationToken, process.env.JWT_FORGOT_PASSWORD_KEY);
		const hashedPassword = await bcrypt.hash(password, 10);

		await pool.query('update mst_users set password = ? where email = ?', [hashedPassword, email]);
		res.render('resetSuccess', { success: true, loginUrl: `localhost:4200/login` });
	} catch (error) {
		console.log(error);
		res.render('resetSuccess', { success: false });
	}
};

module.exports = { registerCustomer, login, getUserDetailsById, verifyUser, updateProfile, deleteUser, forgotPassword, resetPasswordForm, resetPassword };
