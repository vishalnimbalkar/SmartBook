const { emailVerificationToken } = require('../middlewares/jwt');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { generateToken } = require('../middlewares/jwt.js');

const registerCustomer = async (req, res) => {
	try {
		const { name, email, password, phone } = req.body;

		//check email is exists or not
		const emailQuery = `select * from mst_users where email = ?`;
		const [result] = await pool.query(emailQuery, [email]);
		//if result contains user return email already exitst
		if (result.length === 1) {
			return res.status(400).json({ success: false, message: 'Email Already Exists' });
		}

		// Hash the password using bcryptjs
		const hashedPassword = await bcrypt.hash(password, 10);

		// Generate email verification token and store email as payload
		const verificationToken = emailVerificationToken(email);

		//database insert operation
		const userData = [name, email, hashedPassword, phone, verificationToken];
		const query = `insert into mst_users (name, email, password, phone, verificationToken) values(?,?,?,?,?)`;
		await pool.query(query, userData);

		return res.status(200).json({ success: true, message: 'Customer Registed Successfully' });
	} catch (error) {
		console.log(error);
		return res.status(500).json({ success: false, message: 'Server side error', error: error.message });
	}
};

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
module.exports = { registerCustomer, login, getUserDetailsById };
