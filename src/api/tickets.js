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
const canManageTicket = require('../utils/canManageTicket');

/**
 * List all available tickets
 * GET endpoint
 * 
 * :count should be the amount of tickets the user wants to list
 */

app.get('/api/tickets/list/:count', async (req, res) => {
	const userID = req.oidc.userID;
	const ticketsToDisplay = req.params['count'];

	const allowedTickets = [];

	const allTickets = (await database.query('SELECT * FROM tickets;')).rows;

	for (const ticketIndex in allTickets) {
		const ticket = allTickets[ticketIndex];
		if (await canAccessTicket(userID, ticket['ticket_id'])) {
			allowedTickets.push(ticket);
			if (allowedTickets.length == ticketsToDisplay) {
				break;
			}
		}
	}

	res.end(JSON.stringify({
		status: 200,
		response: allowedTickets,
	}));
});

/**
 * Get a specific ticket by it's ID
 * GET endpoint
 */

app.get('/api/tickets/get/:ticketid', async (req, res) => {
	// Get ticket ID from body of request.

	const ticketID = req.params['ticketid'];

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
			response: 'Invalid or missing ticket ID or user ID',
		});
		return;
	}

	// Validation to check that both the user and the ticket
	// being assigned actually exist.
	const validateTicketQ = (await database.query('SELECT * FROM tickets WHERE ticket_id=$1;', [ticketID])).rows[0];
	const validateUserQ = (await database.query('SELECT * FROM users WHERE user_id=$1', [toBeAssignedID])).rows[0];

	// Checks to:
	// - Check that the ticket exists
	// - Check that the user has permissions to manage the ticket
	if (!validateTicketQ || !await canManageTicket(userID, ticketID)) {
		res.statusCode = 403;
		res.json({
			status: 403,
			response: 'Either the ticket you are trying to assign does not exist or you have insufficient permissions to manage it.',
		});
		return;
	}

	// Error if the user being assigned to ticket doesn't exist.

	if (!validateUserQ) {
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

	// Check permission for user to delete the ticket

	if (!ticket || !await canManageTicket(req.oidc.userID, ticketID)) {
		res.statusCode = 403;
		res.json({
			status: 403,
			response: 'Ticket does not exist or you do not have permission to delete it.',
		});
		return;
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