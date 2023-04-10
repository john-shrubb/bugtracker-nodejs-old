// index.js

// Dependencies

const Express = require('express');
const app = Express();

const fs = require('fs');

// Basic config

const config = require('./config/webserver.json');

// Import database connection. Connected to PostgreSQL.

const database = require('./db');

// Connect with auth0 and add it onto the express app

const authmid = require('./auth0');
const { requiresAuth } = require('express-openid-connect'); //eslint-disable-line
app.use(authmid);

// Create a user cache. Holds details of 30 recent users to
// avoid repetitive calls to the database.
// Capped at 30 users to avoid memory leak.

const IDGen = require('./utils/idgen');

// Very basic root link.
// Should redirect to dashboard later in development.

app.use(async (req, res, next) => {
	if (!req.oidc.isAuthenticated()) {
		if (req.path.startsWith('/api')) {
			res.setHeader('Content-Type', 'text/plain');
			res.statusCode = 403;
			const response = JSON.stringify({
				code: 403,
				reason: 'Not authenticated.',
			});

			return res.end(response);
		}
		return res.redirect('/login');
	}

	let rawQuery = await database.query('SELECT * FROM users WHERE auth0id = $1;', [req.oidc.user.sub]);

	if (!rawQuery.rowCount) {
		// Generate a new user ID to be assigned to the new user.

		let userID = IDGen(15);

		// Ensure the userID is not already used in the database
		// by constantly checking
		let validID = false;

		while (!validID) {
			// Check DB to ensure that the user ID has not
			// already been assigned.

			const checkQuery = await database.query('SELECT * FROM users WHERE user_id=$1', userID);

			// If is has then break the loop, otherwise
			// generate a new ID and repeat.

			if (!checkQuery.rows.length) {
				validID = true;
			} else {
				userID = IDGen(15);
			}
		}

		// Register new user with the database.

		rawQuery = await database.query(
			'INSERT INTO users (user_id, username, role, auth0id, email, picture) VALUES ($1, $2, $3, $4, $5, $6);',
			[
				userID,
				req.oidc.user.name,
				1,
				req.oidc.user.sub,
				req.oidc.user.email,
				req.oidc.user.picture
			]
		);
	}

	// Grab the user details from the users table

	rawQuery = (await database.query('SELECT user_id FROM users WHERE auth0id = $1;', [req.oidc.user.sub])).rows[0];

	// Add the user ID onto the request object for easy access
	// in the API and other endpoints.

	req.oidc.userID = rawQuery['user_id'];

	if (rawQuery['picture'] !== req.oidc.user.picture) {
		await database.query('UPDATE users SET picture=$1 WHERE auth0id=$2;', [req.oidc.user.picture, req.oidc.user.sub]);
	}
	next();
});

// Mounts ./static to /assets on web server.
// Removes uneccessary manual pathing.

app.use('/assets/', Express.static('src/static'));
const api = require('./api');
app.use(api);

// Root redirects to dashboard

app.get('/', (_, res) => {
	res.redirect('/dashboard');
});

// Dashboard page

app.get('/dashboard', (req, res) => {
	res.setHeader('Content-Type', 'text/html');
	const file = fs.readFileSync('./src/pages/dashboard.html');
	res.statusCode = 200;
	res.end(file.toString());
});

// Ticket Creation Page

app.get('/tickets/create', (req, res) => {
	res.setHeader('Content-Type', 'text/html');
	const file = fs.readFileSync('./src/pages/create-ticket.html');
	res.statusCode = 200;
	res.end(file.toString());
});

app.get('/tickets/view', (req, res) => {
	res.setHeader('Content-Type', 'text/html');
	const file = fs.readFileSync('./src/pages/view-ticket.html');
	res.statusCode = 200;
	res.end(file.toString());
});

// Test error handler.

app.get('/error', (_, __, next) => {
	next(new Error('abc'));
});

// EXTREMELY basic error handling.

app.use((error, _, res, __) => { //eslint-disable-line
	res.end('500 Error.');
	console.log(error);
});

// Start the web server up.

app.listen(
	config.prodport,
	'0.0.0.0',
	() => console.log('Server online on port ' + config.prodport)
);