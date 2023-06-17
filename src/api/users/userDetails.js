const Express = require('express');
const app = Express();

const database = require('../../db');

app.get('/api/user/details', async (req, res) => {
	const userRole = (await database.query('SELECT role FROM users WHERE user_id=$1;', [req.oidc.userID])).rows[0]['role'];
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
			role: userRole,
		},
	};

	res.setHeader('Content-Type', 'application/json');
	// Will be used for profile pictures etc.
	res.end(JSON.stringify(response));
});

module.exports = app;