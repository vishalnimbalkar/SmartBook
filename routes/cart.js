const express = require('express');
const { jwtAuthMiddleware } = require('../middlewares/jwt.js');
const { requireRole } = require('../middlewares/user.js');
const {
	addBookToCart,
	getCartByUserId,
	updateQunatity,
	removeBookFromCart,
	clearCart,
} = require('../controllers/cart.js');
const router = express.Router();

router.post('/add', jwtAuthMiddleware, requireRole('customer'), addBookToCart);
router.get('/get-all-books', jwtAuthMiddleware, requireRole('customer'), getCartByUserId);
router.patch('/:bookId', jwtAuthMiddleware, requireRole('customer'), updateQunatity);
router.delete('/remove/:bookId', jwtAuthMiddleware, requireRole('customer'), removeBookFromCart);
router.delete('/clear', jwtAuthMiddleware, requireRole('customer'), clearCart);
module.exports = router;
