/**
 * Set priority of a ticket.
 * GET endpoint
 */

const Express = require('express');
const app = Express();

const database = require('../../db');

const verifyIDFormat = require('../../utils/verifyIDFormat');

const canAccessTicket = require('../../utils/canAccessTicket');

app.get('/api/tickets/:ticketid/setpriority/:priority', async (req, res) => {
	const ticketID = req.params['ticketid'];
	const priority = req.params['priority'];

	if (!verifyIDFormat(ticketID)) {
		res.statusCode = 400;
		res.json({
			status: 400,
			response: 'Invalid ticket ID.',
		});
		return;
	}

	if (isNaN(priority) || Number(priority) > 3 || Number(priority) < 1) {
		res.statusCode = 400;
		res.json({
			status: 400,
			response: 'Invalid priority. Must be a number that is between 1 and 3 inclusive.',
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

	await database.query('UPDATE tickets SET priority=$1 WHERE ticket_id=$2;', [priority, ticketID]);

	res.json({
		status: 200,
		response: 'Updated priority sucessfully',
	});
});

module.exports = app;