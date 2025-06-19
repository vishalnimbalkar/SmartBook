const express = require('express');
const { jwtAuthMiddleware } = require('../middlewares/jwt.js');
const { requireRole } = require('../middlewares/user.js');
const { placeOrder, getAllOrders, getAllOrdersByUserId, cancelOrder } = require('../controllers/order.js');
const router = express.Router();

router.post('/place', jwtAuthMiddleware, requireRole('customer'), placeOrder);
router.get('/get-all-orders', jwtAuthMiddleware, requireRole('admin'), getAllOrders);
router.get('/get-orders-by-userId', jwtAuthMiddleware, requireRole('customer'), getAllOrdersByUserId);
router.patch('/cancel/:orderId', jwtAuthMiddleware, cancelOrder);
module.exports = router;
