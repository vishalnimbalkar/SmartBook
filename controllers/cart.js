const { pool } = require('../config/database.js');

//function to add books in cart or update quantity if already in cart
const addBookToCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { bookId, quantity } = req.body;
        const query = `select id from cart_books where userId = ? and bookId = ?`;
        const [rows] = await pool.query(query, [userId, bookId]);
        //check book is already in cart or not
        if (rows.length > 0) {
            // Update quantity
            const updateQuery = `update cart_books set quantity = quantity + ? where userId = ? and bookId = ?`;
            await pool.query(updateQuery, [quantity, userId, bookId]);
        } else {
            // add book to cart
            const insertQuery = `insert into cart_books(userId, bookId, quantity) values (?,?,?)`;
            await pool.query(insertQuery, [userId, bookId, quantity]);
        }
        res.status(200).json({ success: true, message: 'Book added in cart' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

//function get all books for user
const getCartByUserId = async (req, res) => {
    try {
        const userId = Number(req.user.id);
        //check userId is valid or not
        if (isNaN(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }
        const query = `select cb.id, cb.bookId, b.title, b.price, cb.quantity, (b.price * cb.quantity) as totalPrice
             from cart_books cb
             join mst_books b on cb.bookId = b.id
             where cb.userId = ?`;
        const [rows] = await pool.query(query, [userId]);
        //check for empty cart
        if (rows.length === 0) {
            res.status(400).json({ success: false, message: 'Cart is empty' });
        }
        res.status(200).json({ success: true, books: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

//function update quantity of book
const updateQunatity = async (req, res) => {
    try {
        const userId = Number(req.user.id);
        const { bookId, quantity } = req.body;
        const updateQuery = `update cart_books set quantity = ? where userId = ? and bookId = ?`;
        await pool.query(updateQuery, [quantity, userId, bookId]);
        res.status(200).json({ success: true, message: 'Quantity updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

//function update quantity of book
const removeBookFromCart = async (req, res) => {
    try {
        const userId = Number(req.user.id);
        const { bookId } = req.body;
        if (isNaN(userId) || isNaN(bookId)) {
            res.status(400).json({ success: false, message: 'Invalid user or book ID' });
        }
        //remove operation
        const deleteQuery = `delete from cart_books where userId = ? and bookId = ?`;
        await pool.query(deleteQuery, [userId, bookId]);
        res.status(200).json({ success: true, message: 'Book reomved from cart' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

//function remove all books from specific users cart
const clearCart = async (req, res) => {
    try {
        const userId = Number(req.user.id);
        if (isNaN(userId)) {
            res.status(400).json({ success: false, message: 'Invalid User ID' });
        }
        //clear operation
        const query = `delete from cart_books where userId = ?`;
        await pool.query(query, [userId]);
        res.status(200).json({ success: true, message: 'Cart cleared' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { addBookToCart, getCartByUserId, updateQunatity, removeBookFromCart, clearCart };