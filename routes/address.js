const express = require('express');
const { jwtAuthMiddleware } = require('../middlewares/jwt.js');
const { addAddress, getAddressByUserId, updateAddress, deleteAddress } = require('../controllers/address.js');
const router = express.Router();

//address management by customer
router.post('/add/:userId', jwtAuthMiddleware, addAddress);
router.get('/get/:userId', jwtAuthMiddleware, getAddressByUserId);
router.patch('/update/:id', jwtAuthMiddleware, updateAddress);
router.delete('/delete/:id', jwtAuthMiddleware, deleteAddress);

module.exports = router;
