/**
 * Get a user by their email
 * POST endpoint
 * 
 * Request body should look like
 * {
 * 		"userEmail": "john.pork@gmail.com"
 * }
 */

const Express = require('express');
const app = Express();

const database = require('../../db');

app.post('/api/users/get/email', async (req, res) => {
	// Get user email from request body. Convert it to lower case
	// to aid validation.

	const userEmail = req.body['userEmail'].toLowerCase();

	// Use regex (Not mine btw) for format check on email.

	if (!userEmail.match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)) {
		res.statusCode = 400;
		res.json({
			status: 400,
			response: 'Invalid email address',
		});
		return;
	}

	// Get the user details

	const userDetails = (await database.query('SELECT * FROM users WHERE email=$1;', [userEmail])).rows[0];

	// Return the details & exclude some variables for security.
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

	// Send response back to browser.

	res.json(response);
});

module.exports = app;