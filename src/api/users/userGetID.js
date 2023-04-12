/**
 * Get a user by their ID
 * Request body should look like {
 * 		"userID": "692735930173892"
 * }
 */

const Express = require('express');
const app = Express();

const database = require('../../db');

const verifyIDFormat = require('../../utils/verifyIDFormat');

app.post('/api/users/get/id', async (req, res) => {
	// Get user ID from request body.

	const toGetID = req.body['userID'];

	if (!toGetID) {
		res.status = 400;
		res.json({
			status: 400,
			response: 'Missing "userID" from request body.',
		});
		return;
	}

	if (!verifyIDFormat(toGetID)) {
		res.status = 400;
		res.json({
			status: 400,
			response: 'Invalid ID format.',
		});
		return;
	}

	const userDetails = (await database.query('SELECT * FROM users WHERE user_id=$1', [toGetID])).rows[0];

	if (!userDetails) {
		res.statusCode = 404;
		res.json({
			status: 404,
			response: 'User not found.',
		});
		return;
	}

	const response = 
	{
		status: 200,
		response: {
			username: userDetails['username'],
			email: userDetails['email'],
			userID: userDetails['user_id'],
			profilepic: userDetails['picture'],
			role: userDetails['role'],
		},
	};

	res.json(response);
});

module.exports = app;