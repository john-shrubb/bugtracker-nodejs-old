/**
 * api.js
 * 
 * Provide API endpoints for the front end to connect to
 */

const Express = require('express');

const app = Express();

// Pull database connection

const database = require('./db');

// Pull the ID generation function

const IDGen = require('./utils/idgen');

app.use((req, res, next) => {
	// Set some basic details like the content type and status code so this doesn't have to be done later.
	res.setHeader('Content-Type', 'text/plain');
	res.statusCode = 200;
	next();
});

app.use(Express.json())

app.get('/api/v1/user/details', (req, res) => {
	const response = 
	{
		status: 200,
		response: req.oidc.user,
	};

	response['response']['user-id'] = req.oidc.userID;
	res.end(JSON.stringify(response));
});

/**
 * List all available tickets
 * GET endpoint
 * 
 * No body needed.
 */

app.get('/api/v1/tickets/list', async (req, res) => {
	const userID = req.oidc.userID;

	let OwnedTickets = await database.query('SELECT * FROM tickets WHERE user_id=$1;', [userID]);
	OwnedTickets = OwnedTickets.rows;

	let AssignedTickets = await database.query('SELECT ticket_id FROM userassignments WHERE user_id=$1;', [userID]);
	AssignedTickets = AssignedTickets.rows;

	AssignedTickets = [{1: 2, 3: 4,}, {5: 6, 7: 8,}];

	for (let x in AssignedTickets) {
		const ticketID = AssignedTickets[x]['ticket_id'];

		let ticket = await database.query('SELECT * FROM tickets WHERE ticket_id=$1', [ticketID]);
		ticket = ticket.rows;

		OwnedTickets.push(ticket[0]);
	}
	console.log(OwnedTickets);

	res.end(JSON.stringify(OwnedTickets));
});

/**
 * Create a ticket.
 * POST endpoint
 * 
 * Body should look like
 * {
 * 		"title": "Broke the phone",
 * 		"description": "pls fix :)"
 * }
 */

app.post('/api/v1/tickets/create', async (req, res) => {
	const userID = req.oidc.userID;

	if (!req.body['title'] || !req.body['description']) {
		req.statusCode = 400;
		res.json({
			status: 400,
			response: "Missing title or description of ticket in body.",
		});
		return;
	}

	const ticketTitle = req.body['title'].trim();
	const ticketDescription = req.body['description'].trim();

	if (!ticketTitle.length || !ticketDescription.length) {
		res.statusCode = 400
		res.json({
			status: 400,
			response: "Cannot have empty title or description field.",
		});
		return;
	}

	database.query('INSERT INTO tickets (ticket_id, title, description, user_id) VALUES ($1, $2, $3, $4);', [IDGen(15), ticketTitle, ticketDescription, userID]);
});

module.exports = app;