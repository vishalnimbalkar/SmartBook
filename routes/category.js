const express = require('express');
const { jwtAuthMiddleware } = require('../middlewares/jwt.js');
const {
	addCatogory,
	getAllCategories,
	updateCategory,
	deleteCatogory,
	getCategoryById,
} = require('../controllers/category.js');
const { requireRole } = require('../middlewares/user.js');
const { validate } = require('../middlewares/schemaValidatoin.js');
const categorySchema = require('../schemas/category.js');
const router = express.Router();

//category management by admin
router.post('/add', validate(categorySchema), jwtAuthMiddleware, requireRole('admin'), addCatogory);
router.get('/get-all-categories', jwtAuthMiddleware, requireRole('admin'), getAllCategories);
router.get('/:categoryId', getCategoryById);
router.patch('/:categoryId', jwtAuthMiddleware, requireRole('admin'), updateCategory);
router.delete('/:categoryId', jwtAuthMiddleware, requireRole('admin'), deleteCatogory);

module.exports = router;
