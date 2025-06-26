const express = require('express');
const { jwtAuthMiddleware } = require('../middlewares/jwt.js');
const { requireRole } = require('../middlewares/user.js');
const {
	addReview,
	getReviewByBookId,
	getReviewByUserIdBookId,
	updateReview,
	deleteReview,
	getAllReviews,
	getReviewById,
} = require('../controllers/review.js');
const { validate } = require('../middlewares/schemaValidatoin.js');
const reviewSchema = require('../schemas/review.js');
const router = express.Router();

router.post('/add', validate(reviewSchema), jwtAuthMiddleware, requireRole('customer'), addReview);
router.get('/get-all-reviews', jwtAuthMiddleware, requireRole('admin'), getAllReviews);
router.get('/get-book-reviews/:bookId', getReviewByBookId);
router.get('/get-review/:bookId', jwtAuthMiddleware, getReviewByUserIdBookId);
router.get('/:reviewId', jwtAuthMiddleware, getReviewById);
router.patch('/:reviewId', jwtAuthMiddleware, requireRole('customer'), updateReview);
router.delete('/:reviewId', jwtAuthMiddleware, deleteReview);
module.exports = router;
