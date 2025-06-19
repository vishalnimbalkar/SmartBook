const { pool } = require('../config/database');

//function adds new category
const addCatogory = async (req, res) => {
	try {
		const { name, description } = req.body;
		const checkQuery = `select name from mst_categories where name = ? limit 1`;
		const [result] = await pool.query(checkQuery, [name]);
		// check category name is already exists or not
		if (result.length === 1) {
			return res.status(400).json({ success: false, message: 'Category name already exists' });
		}
		//insert operatin
		const query = `insert into mst_categories (name, description) values (?,?)`;
		const categoryData = [name, description];
		await pool.query(query, categoryData);
		return res.status(201).json({ success: true, message: 'Category added successfully' });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ success: false, message: error.message });
	}
};

//function to get all categories list
const getAllCategories = async (req, res) => {
	try {
		const page = Number(req.query.page) || 1;
		const limit = Number(req.query.limit) || 10;
		//calculate offset by using page and limit
		const offset = (page - 1) * limit;

		const { name, description } = req.query;
		let { sortBy, orderBy } = req.query;

		// validate sorting columns and orderby
		const allowedSortBy = ['name', 'createdAt'];
		sortBy = allowedSortBy.includes(sortBy) ? sortBy : 'createdAt';
		orderBy = orderBy === 'desc' ? 'desc' : 'asc';

		// filters
		const filters = [];
		const values = [];

		if (name) {
			filters.push(`name LIKE ?`);
			values.push(`%${name}%`);
		}
		if (description) {
			filters.push(`description LIKE ?`);
			values.push(`%${description}%`);
		}
		const whereClause = filters.length ? `where ${filters.join(' and ')}` : '';

		// Page Count
		const [countRows] = await pool.query(`select count(*) as count from mst_categories ${whereClause}`, values);
		const totalCategories = countRows[0].count;
		const totalPages = Math.ceil(totalCategories / limit);

		// Categories data
		const [rows] = await pool.query(
			`select id, name, description, createdAt, updatedAt 
			 from mst_categories 
			 ${whereClause}
			 where isActive = 1
			 order by ${sortBy} ${orderBy}
			 limit ? offset ?`,
			[...values, limit, offset]
		);

		res
			.status(200)
			.json({
				success: true,
				message: 'Categories data fetched successfully',
				currentPage: page,
				totalPages,
				totalCategories,
				categories: rows,
			});
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, message: error.message });
	}
};

//function to get category by id
const getCategoryById = async (req, res) => {
	try {
		const categoryId = Number(req.params.categoryId);
		//check id is valid or not
		if (isNaN(categoryId)) {
			return res.status(400).json({ success: false, message: 'Invalid Category ID' });
		}
		const [result] = await pool.query(
			`select id, name, description, createdAt, updatedAt from mst_categories where id = ? and isActive = 1 limit 1`,
			[categoryId]
		);
		if (!result[0]) {
			return res.status(400).json({ success: false, message: 'Category not found' });
		}
		return res.status(200).json({ success: true, category: result[0] });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ success: false, message: error.message });
	}
};

//function to update category details
const updateCategory = async (req, res) => {
	try {
		const { name, description } = req.body;
		const categoryId = Number(req.params.categoryId);
		//check id is valid or not
		if (isNaN(categoryId)) {
			return res.status(400).json({ success: false, message: 'Invalid Category ID' });
		}
		//check addess exists or not
		const idQuery = `select id, name, description, createdAt, updatedAt from mst_categories where id = ? and isActive = 1 LIMIT 1`;
		const [result] = await pool.query(idQuery, [categoryId]);
		const category = result[0];
		//if result is empty
		if (!category) {
			return res.status(404).json({ success: false, message: 'Category not found' });
		}
		const fields = { name, description };
		const fieldsToUpdates = [];
		const values = [];

		//add fields and value those are not undefined
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
		// Push category id at the end of the values
		values.push(categoryId);

		//Query to update category
		const query = `update mst_categories set ${fieldsToUpdates.join(', ')} where id = ?`;
		await pool.query(query, values);
		return res.status(200).json({ success: true, message: 'Category updated successfully' });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ success: false, message: error.message });
	}
};

//function to delete category
const deleteCatogory = async (req, res) => {
	try {
		const categoryId = Number(req.params.categoryId);
		//check id is valid or not
		if (isNaN(categoryId)) {
			return res.status(400).json({ success: false, message: 'Invalid category ID' });
		}
		//Check if category is used for book or not
		const [[{ cnt }]] = await pool.query(
			`select count(*) as cnt
       		from mst_books
       		where categoryId = ?`,
			[categoryId]
		);
		if (cnt > 0) {
			const query = `update mst_categories set isActive = 0 where id = ?`;
			const [result] = await pool.query(query, [categoryId]);
			//check category exists or not
			if (result.affectedRows === 0) {
				return res.status(400).json({ success: false, message: 'Category not found' });
			}
		} else {
			// proceed with delete
			const query = `delete from mst_categories where id = ?`;
			const [result] = await pool.query(query, [categoryId]);
			//check category exists or not
			if (result.affectedRows === 0) {
				return res.status(400).json({ success: false, message: 'Category not found' });
			}
		}
		return res.status(200).json({ success: true, message: 'Category deleted successfully' });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ success: false, message: error.message });
	}
};

module.exports = { addCatogory, getAllCategories, updateCategory, deleteCatogory, getCategoryById };
