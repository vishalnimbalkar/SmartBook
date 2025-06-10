const mysql = require('mysql2');

const pool = mysql
	.createPool({
		host: process.env.HOST,
		user: process.env.USER_NAME,
		password: process.env.PASSWORD,
		database: process.env.DATABASE_NAME,
	})
	.promise();

// function to check database connection is success or not
const checkConnection = async () => {
	try {
		const connection = await pool.getConnection();
		console.log('Database Connection Successful!!');
		connection.release();
	} catch (error) {
		console.log('Error connecting to database!');
		throw error;
	}
};

module.exports = { pool, checkConnection };
