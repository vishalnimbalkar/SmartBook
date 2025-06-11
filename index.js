require('dotenv').config();
const http = require('http');
const express = require('express');
const userRoutes = require('./routes/user.js');
const path = require('path');

const port = process.env.PORT;
const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'utilities', 'templates'));
app.use('/images', express.static(path.join(__dirname, 'utilities/images')));
// Required to parse form data from POST requests
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/user', userRoutes);

const server = http.createServer(app);
server.listen(port, () => {
	console.log(`Server running on port ${port}`);
});
