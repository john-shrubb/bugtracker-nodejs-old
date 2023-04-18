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

const Express = require('express');
const app = Express();

const database = require('../../db');

const canManageTicket = require('../../utils/canManageTicket');

app.post('/api/tickets/assign', async (req, res) => {
	if (req.headers['content-type'].toLowerCase() !== 'application/json') {
		res.statusCode = 400;
		res.json({
			status: 400,
			response: 'Incorrect content type',
		});
	}
	
	// Pull User ID from request object

	const userID = req.oidc.userID;

	// Validate body to ensure user ID and ticket ID exist.
	// There will be further validation later to ensure user and
	// ticket exist to prevent the DB throwing an error.

	if (!req.body['ticketID'] || !req.body['userID']) {
		res.statusCode = 400;
		res.json({
			status: 400,
			response: 'Invalid or missing ticket ID or user ID',
		});
		return;
	}
	// Get ticket id and id of user who is getting
	// assigned the ticket from request body

	const ticketID = req.body['ticketID'].trim();
	const toBeAssignedID = req.body['userID'].trim();

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
			response: 'The user you are attempting to assign does not exist.',
		});
		return;
	}

	const userAlreadyAssignedQuery = (await database.query('SELECT user_id FROM userassignments WHERE user_id=$1;', [userID])).rows;
	if (userAlreadyAssignedQuery == true) {
		res.statusCode = 400;
		res.json({
			status: 400,
			response: 'User has already been assigned to ticket.',
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

module.exports = app;