require('dotenv').config();
const http = require('http');
const express = require('express');
const path = require('path');
const userRoutes = require('./routes/user.js');
const addressRoutes = require('./routes/address.js');
const categoryRoutes = require('./routes/category.js');
const bookRoutes = require('./routes/book.js');
const cartRoutes = require('./routes/cart.js');
const orderRoutes = require('./routes/order.js');

const port = process.env.PORT;
const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'utilities', 'templates'));
app.use('/images', express.static(path.join(__dirname, 'utilities/images')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Required to parse form data from POST requests
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/user', userRoutes);
app.use('/address', addressRoutes);
app.use('/category', categoryRoutes);
app.use('/book', bookRoutes);
app.use('/cart', cartRoutes);
app.use('/order', orderRoutes);

const server = http.createServer(app);
server.listen(port, () => {
	console.log(`Server running on port ${port}`);
});
