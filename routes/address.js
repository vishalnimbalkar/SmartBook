const express = require('express');
const { jwtAuthMiddleware } = require('../middlewares/jwt.js');
const {
	addAddress,
	getAddressByUserId,
	getAddressById,
	updateAddress,
	deleteAddress,
} = require('../controllers/address.js');
const { requireRole } = require('../middlewares/user.js');
const { validate } = require('../middlewares/schemaValidatoin.js');
const addressSchema = require('../schemas/address.js');
const router = express.Router();

//address management by customer
router.post('/add', validate(addressSchema), jwtAuthMiddleware, requireRole('customer'), addAddress);
router.get('/get-all', jwtAuthMiddleware, requireRole('customer'), getAddressByUserId);
router.get('/:addressId', jwtAuthMiddleware, getAddressById);
router.patch('/:addressId', jwtAuthMiddleware, requireRole('customer'), updateAddress);
router.delete('/:addressId', jwtAuthMiddleware, requireRole('customer'), deleteAddress);

module.exports = router;
