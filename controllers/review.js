const { pool } = require('../config/database.js');

//function add review
const addReview = async (req, res) => {
	try {
		const userId = Number(req.user.id);
		//check id is valid or not
		if (isNaN(userId)) {
			return res.status(400).json({ success: false, message: 'Invalid User ID' });
		}
		const { bookId, rating, comment } = req.body;
		//check review aleady exists or not
		const [result] = await pool.query(`select id, rating, comment from reviews where userId = ? and bookId = ?`, [
			userId,
			bookId,
		]);
		if (result[0]) {
			return res.status(400).json({ success: false, message: 'Review already added' });
		}
		//insert operation
		const query = `insert into reviews(userId, bookId, rating, comment) values(?,?,?,?)`;
		await pool.query(query, [userId, bookId, rating, comment]);
		return res.status(200).json({ success: true, message: 'Review added successfully' });
	} catch (error) {
		console.log(error);
		return res.status(500).json({ success: false, message: error.message });
	}
};

//fuction get all reviews list
const getAllReviews = async (req, res) => {
	try {
		const page = Number(req.query.page) || 1;
		const limit = Number(req.query.limit) || 10;
		//calculate offset by using page and limit
		const offset = (page - 1) * limit;

		const { comment } = req.query;
		let { sortBy, orderBy } = req.query;

		// validate sorting columns and orderby
		const allowedSortBy = ['rating', 'comment', 'createdAt'];
		sortBy = allowedSortBy.includes(sortBy) ? sortBy : 'createdAt';
		orderBy = orderBy === 'desc' ? 'desc' : 'asc';

		// filters
		const filters = [];
		const values = [];

		if (comment) {
			filters.push(`comment LIKE ?`);
			values.push(`%${comment}%`);
		}
		const whereClause = filters.length ? `where ${filters.join(' and ')}` : '';

		// Page Count
		const [countRows] = await pool.query(`select count(*) as count from reviews ${whereClause}`, values);
		const totalReviews = countRows[0].count;
		const totalPages = Math.ceil(totalReviews / limit);

		// reviews data
		const [rows] = await pool.query(
			`select id, rating, comment, userId, bookId, createdAt, updatedAt 
             from reviews 
             ${whereClause}
             order by ${sortBy} ${orderBy}
             limit ? offset ?`,
			[...values, limit, offset]
		);
		return res
			.status(200)
			.json({
				success: true,
				message: 'Reviews data fetched successfully',
				currentPage: page,
				totalPages,
				totalReviews,
				users: rows,
			});
	} catch (error) {
		console.error(error);
		return res.status(500).json({ success: false, message: error.message });
	}
};

//function get all reviews by book id
const getReviewByBookId = async (req, res) => {
	try {
		const bookId = Number(req.params.bookId);
		//check id is valid or not
		if (isNaN(bookId)) {
			return res.status(400).json({ success: false, message: 'Invalid Book ID' });
		}
		const query = `select r.id, r.rating as rating, r.comment as comment, r.createdAt as createdAt,
        b.id as bookId, b.title as bookTitle,u.id as userId, u.name as userName
        from reviews r 
        join mst_books b on r.bookId = b.id
        join mst_users u on r.userId = u.id
        where r.bookId = ?
        order by r.createdAt desc`;
		const [reviews] = await pool.query(query, [bookId]);
		return res.status(200).json({ success: true, reviews });
	} catch (error) {
		console.log(error);
		return res.status(500).json({ success: false, message: error.message });
	}
};

//function get review by user id and book id
const getReviewByUserIdBookId = async (req, res) => {
	try {
		const userId = Number(req.user.id);
		const bookId = Number(req.params.bookId);
		//check id is valid or not
		if (isNaN(bookId) || isNaN(userId)) {
			return res.status(400).json({ success: false, message: 'Invalid Book or User ID' });
		}
		const query = `select r.id, r.rating as rating, r.comment as comment, r.createdAt as createdAt,
        b.id as bookId, b.title as bookTitle,u.id as userId, u.name as userName
        from reviews r 
        join mst_books b on r.bookId = b.id
        join mst_users u on r.userId = u.id
        where r.bookId = ? and r.userId = ?
        order by r.createdAt desc`;
		const [review] = await pool.query(query, [bookId, userId]);
		return res.status(200).json({ success: true, review });
	} catch (error) {
		console.log(error);
		return res.status(500).json({ success: false, message: error.message });
	}
};

//function get all reviews by book id
const getReviewById = async (req, res) => {
	try {
		const reviewId = Number(req.params.reviewId);
		//check id is valid or not
		if (isNaN(reviewId)) {
			return res.status(400).json({ success: false, message: 'Invalid Review ID' });
		}
		const query = `select id, rating, comment, bookId, userId, createdAt, updatedAt from reviews where id = ? limit 1`;
		const [result] = await pool.query(query, [reviewId]);
		if (!result[0]) {
			return res.status(400).json({ success: false, message: 'Review not found' });
		}
		const review = result[0];
		return res.status(200).json({ success: true, review });
	} catch (error) {
		console.log(error);
		return res.status(500).json({ success: false, message: error.message });
	}
};

//function update review by id
const updateReview = async (req, res) => {
	try {
		const reviewId = Number(req.params.reviewId);
		//check id is valid or not
		if (isNaN(reviewId)) {
			return res.status(400).json({ success: false, message: 'Invalid Review ID' });
		}
		const { rating, comment } = req.body;
		// Map of fields to be updated
		const fields = { rating, comment };
		const values = [];
		const fieldsToUpdates = [];

		// Dynamically build query parts for non-undefined fields
		for (const [key, value] of Object.entries(fields)) {
			if (value !== undefined) {
				fieldsToUpdates.push(`${key} = ?`);
				values.push(value);
			}
		}

		// If no valid fields to update
		if (fieldsToUpdates.length === 0) {
			return res.status(400).json({ success: false, message: 'Please provide valid fields for update.' });
		}
		// Push review id at the end of the values
		values.push(reviewId);

		//Query to update review
		const query = `update reviews set ${fieldsToUpdates.join(', ')} where id = ?`;
		const [result] = await pool.query(query, values);
		//checks review existance and updated or not
		if (result.affectedRows === 0) {
			return res.status(404).json({ success: false, message: 'Review not found or no changes made.' });
		}
		return res.status(200).json({ success: true, message: 'Review details updated successfully' });
	} catch (error) {
		console.log(error);
		return res.status(500).json({ success: false, message: error.message });
	}
};

//function delete review by id
const deleteReview = async (req, res) => {
	try {
		const reviewId = Number(req.params.reviewId);
		//check id is valid or not
		if (isNaN(reviewId)) {
			return res.status(400).json({ success: false, message: 'Invalid Review ID' });
		}
		const query = `delete from reviews where id = ?`;
		const [result] = await pool.query(query, [reviewId]);
		//check review is exists or not
		if (result.affectedRows === 0) {
			return res.status(404).json({ success: false, message: 'Review not found' });
		}
		return res.status(200).json({ success: true, message: 'Review deleted successfully' });
	} catch (error) {
		console.log(error);
		return res.status(500).json({ success: false, message: error.message });
	}
};

module.exports = {
	addReview,
	getAllReviews,
	getReviewByBookId,
	getReviewByUserIdBookId,
	getReviewById,
	updateReview,
	deleteReview,
};
