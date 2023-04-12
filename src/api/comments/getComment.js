/**
 * List comments on a ticket
 * GET endpoint
 * 
 * Note: A presence check is not required for this endpoint
 *       because trying to GET /api/v1/comments/get/ turns up a
 *       404 automatically.
 */

const Express = require('express');
const app = Express();

const database = require('../../db');

const canAccessTicket = require('../../utils/canAccessTicket');
const verifyIDFormat = require('../../utils/verifyIDFormat');

app.get('/api/comments/get/:id', async (req, res) => {
	const ticketID = req.params.id;

	// Format check for ticketID

	if (!verifyIDFormat(ticketID)) {
		res.statusCode = 400;
		res.json({
			status: 400,
			response: 'Invalid or missing ticket ID',
		});
	}

	const ticketOwner = (await database.query('SELECT user_id FROM tickets WHERE ticket_id=$1;', [ticketID])).rows[0];

	if (!ticketOwner || !canAccessTicket(req.oidc.userID, ticketID)) {
		res.statusCode = 403;
		res.json({
			status: 403,
			response: 'This ticket does not exist or you are forbidden from accessing comments on it.',
		});
		return;
	}

	const allComments = (await database.query('SELECT * FROM comments WHERE ticket_id=$1', [ticketID])).rows;

	const response = {
		status: 200,
		response: allComments,
	};

	res.json(JSON.stringify(response));
});

module.exports = app;