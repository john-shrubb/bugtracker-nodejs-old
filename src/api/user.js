/**
 * users.js
 * 
 * All user endpoints.
 */

const Express = require('express');
const app = Express();

const database = require('../db');

const verifyIDFormat = require('../utils/verifyIDFormat');

app.get('/api/v1/user/details', async (req, res) => {
	const userDetails = (await database.query('SELECT role FROM users WHERE user_id=$1;', [req.oidc.userID])).rows[0];
	// Output all necessary details about user
	// Details mostly just pulled from users req.oidc

	const response = 
	{
		status: 200,
		response: {
			username: req.oidc.user.name,
			email: req.oidc.user.email,
			userID: req.oidc.userID,
			profilepic: req.oidc.user.picture,
			role: userDetails['role'],
		},
	};

	// Will be used for profile pictures etc.
	res.end(JSON.stringify(response));
});

/**
 * Get a user by their ID
 * Request body should look like {
 * 		"userID": "692735930173892"
 * }
 */

app.post('/api/v1/users/get/id', async (req, res) => {
	// Get user ID from request body.

	const toGetID = req.body['userID'];

	if (!toGetID) {
		res.status = 400;
		res.json({
			status: 400,
			response: "Missing \"userID\" from request body.",
		});
		return;
	}

	if (!verifyIDFormat(toGetID)) {
		res.status = 400;
		res.json({
			status: 400,
			response: "Invalid ID format.",
		});
		return;
	}

	const userDetails = (await database.query('SELECT * FROM users WHERE user_id=$1', [toGetID])).rows[0];

	if (!userDetails) {
		res.statusCode = 404;
		res.json({
			status: 404,
			response: "User not found.",
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

/**
 * Get a user by their email
 * POST endpoint
 * 
 * Request body should look like
 * {
 * 		"userEmail": "john.pork@gmail.com"
 * }
 */

app.post('/api/v1/users/get/email', async (req, res) => {
	// Get user email from request body. Convert it to lower case
	// to aid validation.

	const userEmail = req.body['userEmail'].toLowerCase();

	// Use regex (Not mine btw) for format check on email.

	if (!userEmail.match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)) {
		res.statusCode = 400;
		res.json({
			status: 400,
			response: "Invalid email address",
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