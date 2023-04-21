/**
 * Get a specific ticket by it's ID
 * GET endpoint
 */

const Express = require('express');
const app = Express();

const database = require('../../db');

const canAccessTicket = require('../../utils/canAccessTicket');
const verifyIDFormat = require('../../utils/verifyIDFormat');

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

module.exports = app;

// The Big Dog was here...