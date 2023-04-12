/**
 * Delete a ticket
 * POST endpoint
 * 
 * Body should look like this
 * {
 * 		"ticketID": "839379647315828"
 * }
 */

const Express = require('express');
const app = Express();

const database = require('../../db');

const verifyIDFormat = require('../../utils/verifyIDFormat');

const canManageTicket = require('../../utils/canManageTicket');

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