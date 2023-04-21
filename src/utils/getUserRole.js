/**
 * Get the role of a user.
 * Returns a number
 * 
 * Pass user's ID as an argument.
 */

const database = require('../db');
const verifyIDFormat = require('./verifyIDFormat');

module.exports = async (userID) => {
	if (!userID || !verifyIDFormat(userID)) {
		throw new Error('Invalid or missing user ID argument.');
	}

	const userRole = (await database.query('SELECT role FROM users WHERE user_id=$1;', [userID])).rows[0];

	if (!userRole) {
		throw new Error('User does not exist.');
	}

	return userRole['role'];
};