const { pool } = require('../config/database');

//function add address in db by user id
const addAddress = async (req, res) => {
	try {
		const { addressLine, city, state, zipCode, country } = req.body;
		const userId = Number(req.params.userId);
		//check id is valid or not
		if (isNaN(userId)) {
			return res.status(400).json({ success: false, message: 'Invalid User ID' });
		}
		//insert operatin
		const query = `insert into user_addresses (userId, addressLine, city, state, zipCode, country) values (?,?,?,?,?,?)`;
		const addressData = [userId, addressLine, city, state, zipCode, country];
		await pool.query(query, addressData);
		return res.status(201).json({ success: true, message: 'Address added successfully' });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ success: false, message: error.message });
	}
};

// function get addresses by user id
const getAddressByUserId = async (req, res) => {
	try {
		const userId = Number(req.params.userId);
		//check id is valid or not
		if (isNaN(userId)) {
			return res.status(400).json({ success: false, message: 'Invalid User ID' });
		}
		//fetch operation
		const query = `select id, addressLine, city, state, zipCode, country, createdAt, updatedAt from user_addresses where userId = ?`;
		const [addresses] = await pool.query(query, [userId]);
		return res
			.status(200)
			.json({
				success: true,
				message: addresses.length ? 'Addresses fetched successfully' : 'No addresses found',
				addresses,
			});
	} catch (error) {
		console.error(error);
		return res.status(500).json({ success: false, message: error.message });
	}
};

//function update address details partially
const updateAddress = async (req, res) => {
	try {
		const { addressLine, city, state, zipCode, country } = req.body;
		const addressId = Number(req.params.id);
		//check id is valid or not
		if (isNaN(addressId)) {
			return res.status(400).json({ success: false, message: 'Invalid address ID' });
		}
		//check addess exists or not
		const idQuery = `select id, addressLine, city, state, zipCode, createdAt, updatedAt from user_addresses where id = ? LIMIT 1`;
		const [result] = await pool.query(idQuery, [addressId]);
		const address = result[0];
		//if result is empty
		if (!address) {
			return res.status(404).json({ success: false, message: 'Address not found' });
		}
		const fields = { addressLine, city, state, zipCode, country };
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
		// Push address id at the end of the values
		values.push(addressId);

		//Query to update address
		const query = `update user_addresses set ${fieldsToUpdates.join(', ')} where id = ?`;
		await pool.query(query, values);
		return res.status(200).json({ success: true, message: 'Address updated successfully' });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ success: false, message: error.message });
	}
};

//function delete address by id
const deleteAddress = async (req, res) => {
	try {
		const addressId = Number(req.params.id);
		//check id is valid or not
		if (isNaN(addressId)) {
			return res.status(400).json({ success: false, message: 'Invalid address ID' });
		}
		const query = 'delete from user_addresses where id = ?';
		const [result] = await pool.query(query, [addressId]);
		//check address is exists or not
		if (result.affectedRows === 0) {
			return res.status(404).json({ success: false, message: 'Address not found' });
		}
		return res.status(200).json({ success: true, message: 'Address deleted successfully' });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ success: false, message: error.message });
	}
};

module.exports = { addAddress, getAddressByUserId, updateAddress, deleteAddress };
