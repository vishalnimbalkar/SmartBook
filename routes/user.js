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
	resetPassword,
	getAllCustomers,
	deactivateCustomer,
	activateCustomer,
} = require('../controllers/user');
const { requireRole } = require('../middlewares/user.js');
const { validate } = require('../middlewares/schemaValidatoin.js');
const userSchema = require('../schemas/user.js');
const router = express.Router();

// Authentication
router.post('/register', validate(userSchema), registerCustomer);
router.get('/verify', verifyUser);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword); // handle reset password

// Customer management by admin
router.get('/get-all-customers', jwtAuthMiddleware, requireRole('admin'), getAllCustomers);
router.patch('/deactivate-customer/:userId', jwtAuthMiddleware, requireRole('admin'), deactivateCustomer);
router.patch('/activate-customer/:userId', jwtAuthMiddleware, requireRole('admin'), activateCustomer);

// Customer Profile
//get id from req.user
router.get('/:id', jwtAuthMiddleware, getUserDetailsById);
router.patch('/update/:id', jwtAuthMiddleware, requireRole('customer'), updateProfile);
router.delete('/delete/:id', jwtAuthMiddleware, requireRole('customer'), deleteUser);

module.exports = router;
