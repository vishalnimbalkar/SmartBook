const { emailVerificationToken } = require('../middlewares/jwt');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

const registerCustomer = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        //check mail is exists or not
        const emailExists = await checkMail(email);
        if (!emailExists) {
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

const checkMail = async (email) => {
    try {
        const query = `select * from mst_users where email = ?`;
        const [result] = await pool.query(query, [email]);
        console.log(result);
        //check if email is exists in db or not if exists return false else true
        return result.length === 1 ? false : true;
    } catch (error) {
        console.log(error);
        return false;
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        //Get user by email
        const query = `select id, email, name, password, phone, isActive, isVerified, createdAt, updatedAt from mst_users where email = ?`;
        const [rows] = await pool.query(query, email);

        //Check if user data is fetched or not
        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
        const user = rows[0];
        if (!user.isActive) {
            return res.status(403).json({ success: false, message: 'Your account is deactivated' });
        }
        if (!user.is_Verified) {
            return res
                .status(403)
                .json({ success: false, message: 'Email is not Verified' });
        }
        //Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        //Generate access token
        const accessToken = generateToken(user);

        return res
            .status(200)
            .json({ success: true, message: 'Login successfully', user, accessToken });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: 'Server side error', error: error.message });
    }
};
module.exports = { registerCustomer, checkMail, login };
