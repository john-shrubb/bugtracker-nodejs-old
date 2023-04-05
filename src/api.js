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
	// Spit out all details about the user.
	const response = 
	{
		status: 200,
		response: req.oidc.user,
	};

	// Append the web server assigned user-id.

	response['response']['user-id'] = req.oidc.userID;
	// Will be used for profile pictures etc.
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

	// Query for the tickets the user directly owns

	let OwnedTickets = await database.query('SELECT * FROM tickets WHERE user_id=$1;', [userID]);
	OwnedTickets = OwnedTickets.rows;

	// Query for tickets that are assigned to the user

	let AssignedTickets = await database.query('SELECT ticket_id FROM userassignments WHERE user_id=$1;', [userID]);
	AssignedTickets = AssignedTickets.rows;

	AssignedTickets = [{1: 2, 3: 4,}, {5: 6, 7: 8,}];

	// For each assigned ticket, query for all the ticket data and push it to the owned tickets array to be output to the endpoint

	for (let x in AssignedTickets) {
		// Grab the ticket ID from each ticket in the array
		const ticketID = AssignedTickets[x]['ticket_id'];

		// Use ticketID to find full ticket info

		let ticket = await database.query('SELECT * FROM tickets WHERE ticket_id=$1', [ticketID]);
		ticket = ticket.rows;

		// Push to OwnedTickets.

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

	// Check that all required fields are present.

	if (!req.body['title'] || !req.body['description']) {
		// Set status code and return an error to the browser.

		req.statusCode = 400;
		res.json({
			status: 400,
			response: "Missing title or description of ticket in body.",
		});
		return;
	}

	// Get ticket title and description from request body.

	const ticketTitle = req.body['title'].trim();
	const ticketDescription = req.body['description'].trim();

	// Check they have a length.

	if (!ticketTitle.length || !ticketDescription.length) {
		res.statusCode = 400
		res.json({
			status: 400,
			response: "Cannot have empty title or description field.",
		});
		return;
	}

	// Get a ticket ID.

	const ticketID = IDGen(15);

	// Query for insertion into database.

	database.query('INSERT INTO tickets (ticket_id, title, description, user_id) VALUES ($1, $2, $3, $4);', [ticketID, ticketTitle, ticketDescription, userID]);

	// Return a 200 OK with the ticket ID in the body.

	res.json({
		status: 200,
		response: IDGen,
	});
});

module.exports = app;