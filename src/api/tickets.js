/**
 * tickets.js
 * 
 * All API endpoints relating to tickets
 * 
 * Comments will be in ./comments.js
 */

// Dependencies

const database = require('../db');
const Express = require('express');
const app = Express();

// Other utility functions

const verifyIDFormat = require('../utils/verifyIDFormat');
const IDGen = require('../utils/idgen');
const canAccessTicket = require('../utils/canAccessTicket');

/**
 * List all available tickets
 * GET endpoint
 * 
 * No body needed.
 */

app.get('/api/tickets/list', async (req, res) => {
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
 * Get a specific ticket by it's ID
 * POST endpoint
 * 
 * Body should look like
 * {
 * 		"ticketID": "937341038758329"
 * }
 */

app.post('/api/tickets/get', async (req, res) => {
	// Get ticket ID from body of request.

	const ticketID = req.body['ticketID'].trim();

	// Presence check for ticket ID

	if (!ticketID) {
		res.statusCode = 400;
		res.json({
			status: 400,
			response: 'Missing "ticketID" key in status body.',
		});
		return;
	}

	// Verify format of ticket ID.

	if (!verifyIDFormat(ticketID)) {
		res.statusCode = 400;
		res.json({
			status: 400,
			response: 'Invalid ticket ID format.',
		});
		return;
	}

	// Grab
	// - Details of the ticket, to return the details to the user
	// - Whether the user was assigned to the ticket to set the
	//   "assigned" variable.

	const ticketDetails = (await database.query('SELECT * FROM tickets WHERE ticket_id=$1;', [ticketID])).rows[0];
	const userAssignmentDetails = (await database.query('SELECT * FROM userassignments WHERE ticket_id=$1 AND user_id=$2', [ticketID, req.oidc.userID])).rows[0];

	// Return error if ticket does not exist OR user cannot
	// access ticket.

	if (!ticketDetails || !await canAccessTicket(req.oidc.userID, ticketID)) {
		res.statusCode = 403;
		res.json({
			status: 403,
			response: 'Either the ticket does not exist or you do not have sufficient permissions to access the ticket.',
		});
		return;
	}

	// The errors above return the exact same response for
	// security purposes. It prevents an attacker from being
	// able to determine if a ticket exists at all to make
	// it more difficult to poke holes in the bug trackers
	// security.

	// Set whether the ticket was assigned or not.

	ticketDetails['assigned'] = userAssignmentDetails ? true : false;

	// Create object to be returned to the user.

	const response = {
		status: 200,
		response: ticketDetails,
	};

	// Return the response.

	res.json(response);
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

app.post('/api/tickets/create', async (req, res) => {
	const userID = req.oidc.userID;

	// Check that all required fields are present.

	if (!req.body['title'] || !req.body['description']) {
		// Set status code and return an error to the browser.

		req.statusCode = 400;
		res.json({
			status: 400,
			response: 'Missing title or description of ticket in body.',
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
			response: 'Cannot have empty title or description field.',
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

	await database.query('INSERT INTO tickets (ticket_id, title, description, user_id) VALUES ($1, $2, $3, $4);', [ticketID, ticketTitle, ticketDescription, userID]);

	// Return a 200 OK with the ticket ID in the body.

	res.json({
		status: 200,
		response: ticketID,
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

app.post('/api/tickets/assign', async (req, res) => {
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
				response: 'Either you do not have permission to assign this ticket or it does not exist.',
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
			response: 'Either you do not have permission to assign this ticket or it does not exist.',
		});
		return;
	}

	// Error if the user being assigned to ticket doesn't exist.

	if (!validateUserQ.rows.length) {
		res.statusCode = 400;
		res.json({
			status: 400,
			response: 'The user you are attempting to assign does not exist.'
		});
		return;
	}

	// After this point it is assumed that all validation checks
	// have been passed.

	database.query('INSERT INTO userassignments (user_id, ticket_id, assigned_by) VALUES ($1, $2, $3);', [toBeAssignedID, ticketID, userID]);
	res.json({
		status: 200,
		response: 'Succesfully assigned user to ticket.',
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

app.post('/api/tickets/delete', async (req, res) => {
	const ticketID = req.body['ticketID'].trim();

	// Validate the ticket ID is valid

	if (!ticketID || !verifyIDFormat(ticketID)) {
		res.statusCode = 400;
		res.json({
			status: 400,
			response: 'Missing or invalid ticket ID.',
		});
		return;
	}

	// Check the ticket exists

	const ticket = (await database.query('SELECT * FROM tickets WHERE ticket_id=$1;', [ticketID])).rows[0];

	if (!ticket) {
		console.log('missing ticket');
		console.log(ticketID);
		console.log(ticket);
		res.statusCode = 403;
		res.json({
			status: 403,
			response: 'Ticket does not exist or you do not have permission to delete it.',
		});
		return;
	}

	// Check permission for user to delete the ticket

	const user = (await database.query('SELECT * FROM users WHERE user_id=$1;', [req.oidc.userID])).rows[0];

	// Users who are a manager or a owner can delete any ticket.

	if (!user.role >= 2) {
		// Only ticket owners can delete their own ticket.
		console.log('actually insufficient perms');

		if (!ticket['user_id'] !== req.oidc.user_id) {
			res.statusCode = 403;
			res.json({
				status: 403,
				response: 'Ticket does not exist or you do not have permission to delete it.',
			});
			return;
		}
	}

	// Past this point it is assumed all validation
	// checks are complete.

	await database.query('DELETE FROM tickets WHERE ticket_id=$1;', [ticketID]);
	res.json({
		status: 200,
		response: 'Succesfully deleted ticket.',
	});
});

module.exports = app;