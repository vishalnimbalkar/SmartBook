const express = require('express');
const { jwtAuthMiddleware } = require('../middlewares/jwt.js');
const { addBook, getBookById, getAllBooks, updateBook, deleteBook } = require('../controllers/book.js');
const { requireRole } = require('../middlewares/user.js');
const { upload } = require('../config/multer.js');
const { multerErrorHandling } = require('../middlewares/multer.js');
const router = express.Router();

//book management by customer
router.post('/add', jwtAuthMiddleware, requireRole('admin'), upload.single('coverPage'), addBook);
router.get('/get/:bookId', getBookById);
router.get('/get-all-books', getAllBooks);
router.patch('/update/:bookId', jwtAuthMiddleware, requireRole('admin'), upload.single('coverPage'), updateBook);
router.delete('/delete/:bookId', jwtAuthMiddleware, requireRole('admin'), deleteBook);

//  Multer error handling middleware 
router.use(multerErrorHandling);

module.exports = router;