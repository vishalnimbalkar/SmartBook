const { pool } = require("../config/database");

//function place order and reomve ordered books from cart
const placeOrder = async (req, res) => {
    try {
        const userId = Number(req.user.id);
        if (isNaN(userId)) {
            res.status(400).json({ success: false, message: 'Invalid user Id' });
        }
        const { addressId, orderMethod } = req.body;

        const cartItemQuery = `select cb.bookId, cb.quantity, b.price
			from cart_books cb
			join mst_books b on cb.bookId = b.id
			WHERE cb.userId = ?`;
        const [cartBooks] = await pool.query(cartItemQuery, [userId]);
        //check for empty cart
        if (cartBooks.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }
        //calculate total price
        let totalAmount = 0;
        cartBooks.forEach(book => {
            totalAmount += book.quantity * book.price;
        });

        //order insert operation
        const insertOrderQuery = `insert into orders (userId, addressId, orderMethod, totalAmount) values (?,?,?,?)`;
        const orderData = [userId, addressId, orderMethod, totalAmount];
        const [orderResult] = await pool.query(insertOrderQuery, orderData);

        const orderId = orderResult.insertId;

        //insert books into order_books
        const orderBooksValues = cartBooks.map(book => { return [orderId, book.bookId, book.quantity, book.price]; });
        const insertQuery = `insert into order_books(orderId, bookId, quantity, price) values ?`;
        await pool.query(insertQuery, [orderBooksValues]);

        // clear ordered books from cart
        await pool.query(`delete from cart_books where userId = ?`, [userId]);
        res.status(200).json({ success: true, message: 'Order placed successfully', orderData: { orderId, totalAmount } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getAllOrders = async (req, res) => {
    try {
        const query = `SELECT
			id, orderStatus, orderMethod, totalAmount, createdAt, userId, addressId
			FROM orders
			ORDER BY createdAt DESC`;
        const [orders] = await pool.query(query);

        //get address details by id
        // const [address] = await pool.query(`select * from user_addresses where id = `)
        res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};
module.exports = { placeOrder, getAllOrders };