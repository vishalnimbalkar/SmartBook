const express = require('express');
const { jwtAuthMiddleware } = require('../middlewares/jwt.js');
const { addAddress, getAddressByUserId, updateAddress, deleteAddress } = require('../controllers/address.js');
const { requireRole } = require('../middlewares/user.js');
const router = express.Router();

//address management by customer
router.post('/add/:userId', jwtAuthMiddleware, requireRole('customer'), addAddress);
router.get('/get/:userId', jwtAuthMiddleware, requireRole('customer'), getAddressByUserId);
router.patch('/update/:id', jwtAuthMiddleware, requireRole('customer'), updateAddress);
router.delete('/delete/:id', jwtAuthMiddleware, requireRole('customer'), deleteAddress);

module.exports = router;
