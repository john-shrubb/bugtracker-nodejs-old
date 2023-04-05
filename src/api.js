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
	// Set some basic details like the content type and status
	// code so this doesn't have to be done later.
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

	// For each assigned ticket, query for all the ticket data
	// and push it to the owned tickets array to be output to the
	// endpoint

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

	let ticketID = IDGen(15);

	// Validate ticket ID to ensure it has not been previously
	// used.

	let validID = false;
	
	while (!validID) {
		const validationQuery = await database.query('SELECT * FROM tickets WHERE ticket_id=$1', [ticketID]);

		if (!validationQuery.rows.length) {
			validID = true;
		} else {
			ticketID = IDGen(15);
		}
	}

	// Query for insertion into database.

	database.query('INSERT INTO tickets (ticket_id, title, description, user_id) VALUES ($1, $2, $3, $4);', [ticketID, ticketTitle, ticketDescription, userID]);

	// Return a 200 OK with the ticket ID in the body.

	res.json({
		status: 200,
		response: IDGen,
	});
});

/**
 * Assign a ticket.
 * POST endpoint
 * 
 * Body should look like this
 * {
 * 		"ticketID": "135735729528475",
 * 		"userID": "967463860136295"
 * 		// This is the ID of the user being assigned.
 * }
 */

app.post('/api/v1/tickets/assign', async (req, res) => {
	// Pull User ID from request object

	const userID = req.oidc.userID;

	// Pull user details

	let userDetails = await database.query('SELECT * FROM users WHERE user_id=$1;', [userID]);
	userDetails = userDetails.rows[0];

	// Get ticket id and id of user who is getting
	// assigned the ticket from request body

	const ticketID = req.body['ticketID'].trim();
	const toBeAssignedID = req.body['userID'].trim();

	// Validate body to ensure user ID and ticket ID exist.
	// There will be further validation later to ensure user and
	// ticket exist to prevent the DB throwing an error.

	if (!ticketID || !toBeAssignedID) {
		res.statusCode = 400;
		res.json({
			status: 400,
			response: 'Invalid or missing ticketID or userID',
		});
		return;
	}

	// Check user priveleges. If they are not a manager or owner
	// then they cannot assign tickets that they do not own.

	if (userDetails['role'] === 1) {
		let userTickets = await database.query('SELECT * FROM tickets WHERE user_id=$1;', [userID]);
		userTickets = userDetails.rows;

		if (!userTickets.length) {
			res.statusCode = 403;
			res.json({
				status: 403,
				response: "Either you do not have permission to assign this ticket or it does not exist.",
			});
			return;
		}
	}

	// Validation to check that both the user and the ticket
	// being assigned actually exist.
	const validateTicketQ = await database.query('SELECT * FROM tickets WHERE ticket_id=$1;', [ticketID]);
	const validateUserQ = await database.query('SELECT * FROM users WHERE user_id=$1', [toBeAssignedID]);

	// Return error if the ticket being assigned does not exist.

	if (!validateTicketQ.rows.length) {
		res.statusCode = 400;
		res.json({
			status: 400,
			response: "Either you do not have permission to assign this ticket or it does not exist.",
		});
		return;
	}

	// Error if the user being assigned to ticket doesn't exist.

	if (!validateUserQ.rows.length) {
		res.statusCode = 400;
		res.json({
			status: 400,
			response: "The user you are attempting to assign does not exist."
		});
		return;
	}

	// After this point it is assumed that all validation checks
	// have been passed.

	database.query('INSERT INTO userassignments (user_id, ticket_id, assigned_by) VALUES ($1, $2, $3);', [toBeAssignedID, ticketID, userID]);
	res.json({
		status: 200,
		response: "Succesfully assigned user to ticket.",
	});
});

module.exports = app;