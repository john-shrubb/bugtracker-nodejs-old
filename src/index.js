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

// Create a user cache. Holds details of 30 recent users to avoid repetitive calls to the database.
// Capped at 30 users to avoid memory leak.

const IDGen = require('./utils/idgen');

// Very basic root link. Should redirect to dashboard later in development.

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
		rawQuery = await database.query(
			'INSERT INTO users (user_id, username, role, auth0id, email) VALUES ($1, $2, $3, $4, $5);',
			[IDGen(15), req.oidc.user.name, 1, req.oidc.user.sub, req.oidc.user.email]
		);
	}

	rawQuery = await database.query('SELECT user_id FROM users WHERE auth0id = $1;', [req.oidc.user.sub]);

	req.oidc.userID = rawQuery.rows[0]['user_id'];
	next();
});

app.use(require('./api'));

app.get('/', (req, res) => {
	res.setHeader('Content-Type', 'text/html');
	const file = fs.readFileSync('./src/pages/dashboard.html');
	res.statusCode = 200;
	res.end(file.toString());
});

app.get('/error', (_, __, next) => {
	next(new Error('abc'))
})

// Mounts ./static to /assets on web server. Removes uneccessary manual pathing.

app.use('/assets', Express.static('src/static'));

// EXTREMELY basic error handling.

app.use((error, _, res, __) => {
	res.end('500 Error.');
	console.log(error);
})

// Start the web server up.

app.listen(
	config.prodport,
	'0.0.0.0',
	() => console.log('Server online on port ' + config.prodport)
);