const jwt = require('jsonwebtoken');

const jwtAuthMiddleware = (req, res, next) => {
	const authHeader = req.headers.authorization;
	// Check for autorization header is present or not
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return res.status(401).json({ success: false, message: 'Unauthorized' });
	}
	//Access jwt taoken from request headers
	const token = authHeader.split(' ')[1];
	try {
		// Verify the jwt token
		const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
		// Add decoded data in request object
		req.user = decoded;
		next();
	} catch (error) {
		return res.status(500).json({ success: false, message: error.message });
	}
};

/**
 * Function to generate jwt token
 */
const generateToken = (userData) => {
	//Generate new jwt access token using user data
	const accessToken = jwt.sign(userData, process.env.JWT_SECRET_KEY);
	return accessToken;
};

// Function to generate jwt token for email verificaation
const emailVerificationToken = (userData) => {
	const verificationToken = jwt.sign(userData, process.env.JWT_VERIFICATION_KEY);
	return verificationToken;
};

module.exports = { jwtAuthMiddleware, generateToken, emailVerificationToken };
