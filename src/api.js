/**
 * api.js
 * 
 * Provide API endpoints for the front end to connect to
 */

const Express = require('express');

const app = Express();

// Pull database connection

const database = require('./db');

// Pull the ID generation function & verification

const IDGen = require('./utils/idgen');
const verifyIDFormat = require('./utils/verifyIDFormat');

app.use((req, res, next) => {
	// Set some basic details like the content type and status
	// code so this doesn't have to be done later.
	res.setHeader('Content-Type', 'text/plain');
	res.statusCode = 200;
	next();
});

app.use(Express.json());

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
 * Get a user
 * Request body should look like {
 * 		"getby": "email",
 * 		"identifier": "john.pork@gmail.com"
 * }
 */

app.post('/api/v1/user/get', async (req, res) => {
	const toGetID = req.body['userID'];

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

	req.json(response);
});

/**
 * List all available tickets
 * GET endpoint
 * 
 * No body needed.
 */

app.get('/api/v1/tickets/list', async (req, res) => {
	const userID = req.oidc.userID;
	const userDetails = (await database.query('SELECT * FROM users WHERE user_id=$1', [userID])).rows[0];

	if (userDetails.role >= 2) {
		const allTickets = (await database.query('SELECT * FROM tickets;')).rows;

		for (const x in allTickets) {
			if (allTickets[x]['user_id'] == userID) {
				allTickets[x]['assigned'] = false;
			} else {
				allTickets[x]['assigned'] = true;
			}
		}

		res.end(JSON.stringify(allTickets));
		return;
	}

	// Query for the tickets the user directly owns

	const OwnedTickets = (await database.query('SELECT * FROM tickets WHERE user_id=$1;', [userID])).rows;

	// Provide information on whether user was assigned the
	// ticket or not in the output.
	for (const x in OwnedTickets) {
		OwnedTickets[x]['assigned'] = false;
	}

	// Query for tickets that are assigned to the user

	const AssignedTickets = (await database.query('SELECT ticket_id FROM userassignments WHERE user_id=$1;', [userID])).rows;

	// For each assigned ticket, query for all the ticket data
	// and push it to the owned tickets array to be output to the
	// endpoint

	for (const x in AssignedTickets) {
		// Grab the ticket ID from each ticket in the array
		const ticketID = AssignedTickets[x]['ticket_id'];

		// Use ticketID to find full ticket info

		const ticket = (await database.query('SELECT * FROM tickets WHERE ticket_id=$1', [ticketID])).rows;

		// Push to OwnedTickets.

		if (ticket[0]) {
			// Provide information on whether user was assigned
			// the ticket or not in the output.
			ticket[0]['assigned'] = true;
			OwnedTickets.push(ticket[0]);
		}
	}

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
		res.statusCode = 400;
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

	const userDetails = (await database.query('SELECT * FROM users WHERE user_id=$1;', [userID])).rows[0];

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

		if (!userTickets) {
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

/**
 * Delete a ticket
 * POST endpoint
 * 
 * Body should look like this
 * {
 * 		"ticketID": "839379647315828"
 * }
 */

app.post('/api/v1/tickets/delete', async (req, res) => {
	const ticketID = req.body['ticketID'].trim();

	// Validate the ticket ID is valid

	if (!ticketID || !verifyIDFormat(ticketID)) {
		res.statusCode = 400;
		res.json({
			status: 400,
			response: "Missing or invalid ticket ID.",
		});
		return;
	}

	// Check the ticket exists

	const ticket = (await database.query('SELECT * FROM tickets WHERE ticket_id=$1;', [ticketID])).rows[0];

	if (!ticket.length) {
		res.statusCode = 403;
		res.json({
			status: 403,
			response: "Ticket does not exist or you do not have permission to delete it.",
		});
		return;
	}

	// Check permission for user to delete the ticket

	const user = (await database.query('SELECT * FROM users WHERE user_id=$1;', [req.oidc.userID])).rows[0];

	// Users who are a manager or a owner can delete any ticket.

	if (!user.role >= 2) {
		// Only ticket owners can delete their own ticket.

		if (!ticket['user_id'] !== req.oidc.user_id) {
			res.statusCode = 403;
			res.json({
				status: 403,
				response: "Ticket does not exist or you do not have permission to delete it.",
			});
			return;
		}
	}

	// Past this point it is assumed all validation
	// checks are complete.

	await database.query('DELETE FROM tickets WHERE ticket_id=$1;', [ticketID]);
	res.json({
		status: 200,
		response: "Succesfully deleted ticket.",
	});
});

module.exports = app;