const mysql = require('mysql2');

const pool = mysql
	.createPool({
		host: process.env.HOST,
		user: process.env.USER_NAME,
		password: process.env.PASSWORD,
		database: process.env.DATABASE_NAME,
		port: process.env.DATABASE_PORT,
	})
	.promise();

module.exports = { pool };
