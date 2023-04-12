/**
 * Set priority of a ticket.
 * GET endpoint
 */

const Express = require('express');
const app = Express();

const database = require('../../db');

const verifyIDFormat = require('../../utils/verifyIDFormat');

const canAccessTicket = require('../../utils/canAccessTicket');

app.get('/api/tickets/:ticketid/setstatus/:status', async (req, res) => {
	const ticketID = req.params['ticketid'];
	const status = req.params['status'];

	if (!verifyIDFormat(ticketID)) {
		res.statusCode = 400;
		res.json({
			status: 400,
			response: 'Invalid ticket ID.',
		});
		return;
	}

	if (isNaN(status) || Number(status) > 3 || Number(status) < 1) {
		res.statusCode = 400;
		res.json({
			status: 400,
			response: 'Invalid status. Must be a number that is between 1 and 3 inclusive.',
		});
		return;
	}

	const ticketExists = (await database.query('SELECT ticket_id FROM tickets WHERE ticket_id=$1;', [ticketID])).rows[0];

	if (!ticketExists || !await canAccessTicket(req.oidc.userID, ticketID)) {
		res.statusCode = 403,
		res.json({
			status: 403,
			response: 'This ticket does not exist or you are not allowed to access it.',
		});
		return;
	}

	await database.query('UPDATE tickets SET status=$1 WHERE ticket_id=$2;', [status, ticketID]);

	res.json({
		status: 200,
		response: 'Updated status sucessfully',
	});
});

module.exports = app;