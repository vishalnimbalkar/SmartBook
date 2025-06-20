const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

//function add new book
const addBook = async (req, res) => {
	try {
		const { title, description, price, stock, authorName, categoryId } = req.body;
		let coverPage = null;
		if (req.file) {
			// Read image file as binary buffer
			const filePath = path.join(__dirname, '../uploads/books', req.file.filename);
			coverPage = fs.readFileSync(filePath);
			// Optionally delete the file after reading
			fs.unlinkSync(filePath);
		}
		const status = stock > 0 ? 'available' : 'out-of-stock';
		const query = `
            INSERT INTO mst_books 
            (title, description, price, stock, status, coverPage, authorName, categoryId) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
		const bookData = [title, description, price, stock, status, coverPage, authorName, categoryId];
		await pool.query(query, bookData);
		return res.status(201).json({ success: true, message: 'Book added successfully' });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ success: false, message: error.message });
	}
};

//function to get book by book id
const getBookById = async (req, res) => {
	try {
		const bookId = Number(req.params.bookId);
		//check bookId is valid or not
		if (isNaN(bookId)) {
			return res.status(400).json({ success: false, message: 'Invalid book IDdcsd' });
		}
		const query = `
            SELECT b.id, b.title, b.description, b.price, b.stock, b.coverPage, b.authorName, b.categoryId,
            c.name AS categoryName, b.createdAt, b.updatedAt
            FROM mst_books b
            JOIN mst_categories c ON b.categoryId = c.id
            WHERE b.id = ? and b.isActive = 1 LIMIT 1
        `;
		const [row] = await pool.query(query, [bookId]);
		const book = row[0];
		//check book is fetched or not
		if (!book) {
			return res.status(404).json({ success: false, message: 'Book not found' });
		}
		// Convert binary image to base64 if exists
		if (book.coverPage) {
			const base64Image = book.coverPage.toString('base64');
			// Assuming image is JPEG or PNG (you can add MIME type detection if needed)
			book.coverPage = `data:image/jpeg;base64,${base64Image}`;
		} else {
			book.coverPage = null;
		}
		return res.status(200).json({ success: true, message: 'Book fetched successfully', book });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ success: false, message: error.message });
	}
};

//get all books using pagination
const getAllBooks = async (req, res) => {
	try {
		const page = Number(req.query.page) || 1;
		const limit = Number(req.query.limit) || 10;
		//calculate offset by using page and limit
		const offset = (page - 1) * limit;

		const { title, description, price, stock, authorName } = req.query;
		let { sortBy, orderBy } = req.query;

		// validate sorting columns and orderby
		const allowedSortBy = ['title', 'price', 'createdAt'];
		sortBy = allowedSortBy.includes(sortBy) ? sortBy : 'createdAt';
		orderBy = orderBy === 'desc' ? 'desc' : 'asc';

		// filters
		const filters = [];
		const values = [];

		if (title) {
			filters.push(`title LIKE ?`);
			values.push(`%${title}%`);
		}
		if (description) {
			filters.push(`description LIKE ?`);
			values.push(`%${description}%`);
		}
		if (price) {
			filters.push(`price LIKE ?`);
			values.push(`%${price}%`);
		}
		if (stock) {
			filters.push(`stock LIKE ?`);
			values.push(`%${stock}%`);
		}
		if (authorName) {
			filters.push(`authorName LIKE ?`);
			values.push(`%${authorName}%`);
		}

		//where condtion based on provided values
		const whereClause = filters.length ? `and ${filters.join(' and ')}` : '';

		// calculating total pages and books
		const [countRows] = await pool.query(
			`select count(*) as count from mst_books where isActive = 1 ${whereClause}`,
			values
		);
		const totalBooks = countRows[0].count;
		const totalPages = Math.ceil(totalBooks / limit);

		// Books data
		const [books] = await pool.query(
			`SELECT b.id, b.title, b.description, b.price, b.stock, b.coverPage, b.authorName, b.categoryId, c.name AS categoryName,b.createdAt, b.updatedAt 
            FROM mst_books b
            JOIN mst_categories c 
            ON b.categoryId = c.id
            where b.isActive = 1 ${whereClause}
            ORDER BY ${sortBy} ${orderBy}
            LIMIT ? OFFSET ?`,
			[...values, limit, offset]
		);

		const booksWithImage = books.map((book) => {
			if (book.coverPage) {
				const base64Image = book.coverPage.toString('base64');
				book.coverPage = `data:image/jpeg;base64,${base64Image}`;
			} else {
				book.coverPage = null;
			}
			return book;
		});
		return res
			.status(200)
			.json({
				success: true,
				message: 'Books data fetched successfully',
				currentPage: page,
				totalPages,
				totalBooks,
				books: booksWithImage,
			});
	} catch (error) {
		console.error(error);
		return res.status(500).json({ success: false, message: error.message });
	}
};

//function update book details
const updateBook = async (req, res) => {
	try {
		console.log(req.file);
		const { title, description, price, stock, authorName, categoryId } = req.body || {};
		const bookId = Number(req.params.bookId);
		//check bookId is valid or not
		if (isNaN(bookId)) {
			return res.status(400).json({ success: false, message: 'Invalid book ID' });
		}
		//check book exists or not
		const idQuery = `select id, title, description, price, stock, coverPage, authorName, categoryId, createdAt, updatedAt from mst_books where id = ? and isActive = 1 LIMIT 1`;
		const [result] = await pool.query(idQuery, [bookId]);
		const book = result[0];
		//if result is empty
		if (!book) {
			return res.status(404).json({ success: false, message: 'Book not found' });
		}

		const fields = { title, description, price, stock, authorName, categoryId };
		const fieldsToUpdates = [];
		const values = [];

		//add fields and value those are not undefined
		for (const [key, value] of Object.entries(fields)) {
			if (value !== undefined) {
				fieldsToUpdates.push(`${key} = ?`);
				values.push(value);
			}
		}

		//check and update cover image as BLOB
		if (req.file) {
			const filePath = path.join(__dirname, '../uploads/books', req.file.filename);
			const imageBuffer = fs.readFileSync(filePath);
			fs.unlinkSync(filePath); // delete after reading
			fieldsToUpdates.push(`coverPage = ?`);
			values.push(imageBuffer);
		}

		// If no valid fields to update
		if (fieldsToUpdates.length === 0) {
			return res.status(400).json({ success: false, message: 'Please provide valid fields for update.' });
		}

		// Push book id at the end of the values
		values.push(bookId);

		//Query to update book
		const query = `update mst_books set ${fieldsToUpdates.join(', ')} where id = ?`;
		await pool.query(query, values);
		return res.status(200).json({ success: true, message: 'Book updated successfully' });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ success: false, message: error.message });
	}
};

//function delete book
const deleteBook = async (req, res) => {
	try {
		const bookId = Number(req.params.bookId);
		//check bookId is valid or not
		if (isNaN(bookId)) {
			return res.status(400).json({ success: false, message: 'Invalid book ID' });
		}

		//check book is used for orders or not
		const [[{ orderCnt }]] = await pool.query(`select count(*) as orderCnt from order_books where bookId = ?`, [
			bookId,
		]);
		const [[{ reviewCnt }]] = await pool.query(`select count(*) as reviewCnt from reviews where bookId = ?`, [bookId]);
		if (orderCnt > 0 || reviewCnt > 0) {
			// set inactive
			const [result] = await pool.query(`update mst_books set isActive = 0 where id = ?`, [bookId]);
			//check book table updated or not
			if (result.affectedRows === 0) {
				return res.status(400).json({ success: false, message: 'Book not found' });
			}
		} else {
			//proceed to delete
			const query = `delete from mst_books where id = ? and isActive = 1`;
			const [result] = await pool.query(query, [bookId]);
			//check book deleted or not
			if (result.affectedRows === 0) {
				return res.status(400).json({ success: false, message: 'Book not found' });
			}
		}
		return res.status(200).json({ success: true, message: 'Book deleted successfully' });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ success: false, message: error.message });
	}
};

module.exports = { addBook, getBookById, getAllBooks, updateBook, deleteBook };
