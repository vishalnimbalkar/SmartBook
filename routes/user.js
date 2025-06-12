const express = require('express');
const { jwtAuthMiddleware } = require('../middlewares/jwt.js');
const {
	registerCustomer,
	verifyUser,
	login,
	getUserDetailsById,
	updateProfile,
	deleteUser,
	forgotPassword,
	resetPasswordForm,
	resetPassword,
} = require('../controllers/user');
const router = express.Router();

// Authentication
router.post('/register', registerCustomer);
router.get('/verify', verifyUser);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.get('/reset-password', resetPasswordForm); // render EJS form
router.post('/reset-password', resetPassword); // handle reset password

// Customer Profile
router.get('/:id', jwtAuthMiddleware, getUserDetailsById);
router.patch('/update/:id', jwtAuthMiddleware, updateProfile);
router.delete('/delete/:id', jwtAuthMiddleware, deleteUser);

module.exports = router;
