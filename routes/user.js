const express = require('express');
const { jwtAuthMiddleware } = require('../middlewares/jwt.js');
const { registerCustomer, login, getUserDetailsById } = require('../controllers/user');
const router = express.Router();

router.post('/register', registerCustomer);
router.post('/login', login);
//get user details using id
router.get('/:id', jwtAuthMiddleware, getUserDetailsById);

module.exports = router;
