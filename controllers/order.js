const { pool } = require('../config/database');

//function place order and reomve ordered books from cart
const placeOrder = async (req, res) => {
	const connection = await pool.getConnection();
	try {
		const userId = Number(req.user.id);
		if (isNaN(userId)) {
			return res.status(400).json({ success: false, message: 'Invalid user ID' });
		}
		const { addressId, orderMethod } = req.body;
		await connection.beginTransaction();
		// 1. Get cart items with book prices and stock
		const cartItemQuery = `
			SELECT cb.bookId, cb.quantity, b.price, b.stock
			FROM cart_books cb
			JOIN mst_books b ON cb.bookId = b.id
			WHERE cb.userId = ?
		`;
		const [cartBooks] = await connection.query(cartItemQuery, [userId]);
		if (cartBooks.length === 0) {
			await connection.rollback();
			return res.status(400).json({ success: false, message: 'Cart is empty' });
		}
		// 2. Check stock availability
		for (const book of cartBooks) {
			if (book.stock < book.quantity) {
				await connection.rollback();
				return res
					.status(400)
					.json({ success: false, message: `Not enough stock for bookId ${book.bookId}. Only ${book.stock} left.` });
			}
		}
		// 3. Calculate total amount
		let totalAmount = 0;
		cartBooks.forEach((book) => {
			totalAmount += book.quantity * book.price;
		});
		// 4. Insert into orders
		const insertOrderQuery = `
			INSERT INTO orders (userId, addressId, orderMethod, totalAmount)
			VALUES (?, ?, ?, ?)
		`;
		const [orderResult] = await connection.query(insertOrderQuery, [userId, addressId, orderMethod, totalAmount]);
		const orderId = orderResult.insertId;
		// 5. Insert into order_books
		const orderBooksValues = cartBooks.map((book) => {
			return [orderId, book.bookId, book.quantity, book.price];
		});
		await connection.query(`INSERT INTO order_books (orderId, bookId, quantity, price) VALUES ?`, [orderBooksValues]);
		// 6. Decrease stock for each book
		for (const book of cartBooks) {
			await connection.query(`UPDATE mst_books SET stock = stock - ? WHERE id = ?`, [book.quantity, book.bookId]);
		}
		// 7. Clear cart
		await connection.query(`DELETE FROM cart_books WHERE userId = ?`, [userId]);

		await connection.commit();
		return res
			.status(200)
			.json({ success: true, message: 'Order placed successfully', orderData: { orderId, totalAmount } });
	} catch (error) {
		await connection.rollback();
		return res.status(500).json({ success: false, message: error.message });
	} finally {
		connection.release();
	}
};

//function get all order details (addresses, user, address, books)
const getAllOrders = async (req, res) => {
	try {
		const query = `
            SELECT
                o.id AS orderId, o.orderStatus, o.orderMethod, o.createdAt,
                u.id AS userId, u.name AS userName, u.email AS userEmail,
                a.city, a.state, a.zipCode,
                ob.bookId, ob.quantity, ob.price,
                b.title AS bookTitle
            FROM orders o
            JOIN mst_users u ON o.userId = u.id
            JOIN user_addresses a ON o.addressId = a.id
            JOIN order_books ob ON o.id = ob.orderId
            JOIN mst_books b ON ob.bookId = b.id
            ORDER BY o.createdAt DESC
        `;
		const [rows] = await pool.query(query);
		const orderMap = new Map();
		for (const row of rows) {
			if (!orderMap.has(row.orderId)) {
				orderMap.set(row.orderId, {
					orderId: row.orderId,
					orderStatus: row.orderStatus,
					orderMethod: row.orderMethod,
					createdAt: row.createdAt,
					user: { id: row.userId, name: row.userName, email: row.userEmail },
					address: { city: row.city, state: row.state, pincode: row.zipCode },
					books: [],
				});
			}
			orderMap
				.get(row.orderId)
				.books.push({ bookId: row.bookId, title: row.bookTitle, quantity: row.quantity, price: Number(row.price) });
		}
		const orders = Array.from(orderMap.values());
		return res.status(200).json({ success: true, orders });
	} catch (error) {
		return res.status(500).json({ success: false, message: error.message });
	}
};

//function get all order details by user id (addresses, user, address, books)
const getAllOrdersByUserId = async (req, res) => {
	try {
		const userId = Number(req.user.id);
		const query = `
            SELECT
                o.id AS orderId, o.orderStatus, o.orderMethod, o.createdAt,
                a.city, a.state, a.zipCode,
                ob.bookId, ob.quantity, ob.price,
                b.title AS bookTitle
            FROM orders o
            JOIN user_addresses a ON o.addressId = a.id
            JOIN order_books ob ON o.id = ob.orderId
            JOIN mst_books b ON ob.bookId = b.id
            WHERE o.userId = ?
            ORDER BY o.createdAt DESC
        `;
		const [rows] = await pool.query(query, [userId]);
		const orderMap = new Map();
		for (const row of rows) {
			if (!orderMap.has(row.orderId)) {
				orderMap.set(row.orderId, {
					orderId: row.orderId,
					orderStatus: row.orderStatus,
					orderMethod: row.orderMethod,
					createdAt: row.createdAt,
					address: { city: row.city, state: row.state, pincode: row.zipCode },
					books: [],
				});
			}
			orderMap
				.get(row.orderId)
				.books.push({ bookId: row.bookId, title: row.bookTitle, quantity: row.quantity, price: Number(row.price) });
		}
		const orders = Array.from(orderMap.values());
		return res.status(200).json({ success: true, orders });
	} catch (error) {
		return res.status(500).json({ success: false, message: error.message });
	}
};

const cancelOrder = async (req, res) => {
	const connection = await pool.getConnection();
	try {
		const orderId = Number(req.params.orderId);
		if (isNaN(orderId)) {
			return res.status(400).json({ success: false, message: 'Invalid user ID or order ID' });
		}
		await connection.beginTransaction();
		// 1) Fetch the order and ensure it's cancellable
		const [order] = await connection.query(
			`SELECT id, userId, addressId, deliveredDate, orderMethod, orderStatus, totalAmount, createdAt, updatedAt
   			FROM orders
   			WHERE id = ? LIMIT 1`,
			[orderId]
		);
		if (order.length === 0) {
			await connection.rollback();
			return res.status(404).json({ success: false, message: 'Order not found' });
		}
		if (['Cancelled', 'Delivered'].includes(order[0].orderStatus)) {
			await connection.rollback();
			return res
				.status(400)
				.json({ success: false, message: `Cannot cancel an order that is already ${order[0].orderStatus}` });
		}

		// 2) Update order status to 'Cancelled'
		await connection.query(
			`UPDATE orders
          SET orderStatus = 'Cancelled', updatedAt = NOW()
        WHERE id = ?`,
			[orderId]
		);

		// 3) Restore stock: for each book in order_books
		const [book] = await connection.query(
			`SELECT bookId, quantity
         	FROM order_books
        	WHERE orderId = ?`,
			[orderId]
		);
		for (const { bookId, quantity } of book) {
			await connection.query(
				`UPDATE mst_books
            	SET stock = stock + ?
          		WHERE id = ?`,
				[quantity, bookId]
			);
		}
		await connection.commit();
		return res.json({ success: true, message: 'Order cancelled and stock restored successfully.' });
	} catch (err) {
		await connection.rollback();
		return res.status(500).json({ success: false, message: err.message });
	} finally {
		connection.release();
	}
};
module.exports = { placeOrder, getAllOrders, getAllOrdersByUserId, cancelOrder };
