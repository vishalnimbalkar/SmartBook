const express = require('express');
const { registerCustomer, login } = require('../controllers/user');
const router = express.Router();

router.post('/register', registerCustomer);
router.post('/login', login);

module.exports = router;
