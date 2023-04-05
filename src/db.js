const pg = require('pg');
require('dotenv').config();

const database = new pg.Pool({
	'database': process.env.PG_DATABASE,
	'port': process.env.PG_PORT,
	'host': process.env.PG_HOST,
	'user': process.env.PG_USER,
	'password': process.env.PG_PASSWORD
});

database.connect();

module.exports = database;