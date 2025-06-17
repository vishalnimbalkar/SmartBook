const express = require('express');
const { jwtAuthMiddleware } = require('../middlewares/jwt.js');
const { requireRole } = require('../middlewares/user.js');
const router = express.Router();

// router.post('/cart/add', addBookToCart);
// router.get('/cart/:userId', getCartByUserId);
// router.put('/cart/update', updateCartBook);
// router.delete('/cart/remove', removeBookFromCart);
// router.delete('/cart/clear/:userId', clearCart);


module.exports = router;
