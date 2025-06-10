require('dotenv').config();
const http = require('http');
const express = require('express');

const { checkConnection } = require('./config/database');
const userRoutes = require('./routes/user.js');
const { sendEmail } = require('./services/email.js');

const port = process.env.PORT;
const app = express();

app.use(express.json());
app.use('/user', userRoutes);

const server = http.createServer(app);
server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
checkConnection();

sendEmail('vishalnimbalkar78@gmail.com', 'vishal nimbalkar', 'dsfhadslkfjs;dkjf');