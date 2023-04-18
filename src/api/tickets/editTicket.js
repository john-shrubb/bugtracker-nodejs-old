/**
 * Edit a ticket
 * POST endpoint
 * 
 * Response body would look like:
 * {
 * 		"title": "New title here",
 * 		"description": "New description here"
 * }
 */

const Express = require('express');
const app = Express();

const database = require('../../db');
const verifyIDFormat = require('../../utils/verifyIDFormat');
const canAccessTicket = require('../../utils/canAccessTicket');

app.post('/api/tickets/:id/edit', async (req, res) => {
	const ticketID = req.params['id'];
	const userID = req.oidc.userID;

	if (!verifyIDFormat(ticketID)) {
		res.statusCode = 400;
		res.json({
			status: 400,
			response: 'Invalid ticket ID',
		});
		return;
	}

	const ticketTitle = req.body['title'] ? req.body['title'].trim() : null;
	const ticketDescription = req.body['description'] ? req.body['description'].trim() : null;

	if (!ticketTitle && !ticketDescription) {
		res.statusCode = 400;
		res.json({
			status: 400,
			response: 'Body must either contain a title or description',
		});
		return;
	}

	const ticketOwner = (await database.query('SELECT user_id FROM tickets WHERE ticket_id=$1;', [ticketID])).rows[0];

	if (!ticketOwner || !canAccessTicket(userID, ticketID)) {
		res.statusCode = 403;
		res.json({
			status: 403,
			response: 'Ticket could not be found or you have insufficient permissions to access it.',
		});
		return;
	}

	if (ticketOwner['user_id'] !== userID) {
		res.statusCode = 403;
		res.json({
			status: 403,
			response: 'You must be the owner of this ticket to make changes to it\'s title or description.',
		});
		return;
	}

	if (ticketTitle && ticketDescription) {
		const oldTicketDetails = (await database.query('SELECT title, description FROM tickets WHERE ticket_id=$1;', [ticketID])).rows[0];
		await database.query('UPDATE tickets SET title=$1, description=$2 WHERE ticket_id=$3;', [ticketTitle, ticketDescription, ticketID]);
		await database.query('INSERT INTO ticketmodifications (ticket_id, old_title, new_title, old_description, new_description) VALUES ($1, $2, $3, $4, $5);', [ticketID, oldTicketDetails['title'], ticketTitle, oldTicketDetails['description'], ticketDescription]);
	} else if (ticketTitle) {
		const oldTicketDetails = (await database.query('SELECT title FROM tickets WHERE ticket_id=$1;', [ticketID])).rows[0];
		await database.query('UPDATE tickets SET title=$1 WHERE ticket_id=$2;', [ticketTitle]);
		await database.query('INSERT INTO ticketmodifications (ticket_id, old_title, new_title) VALUES ($1, $2, $3);', [ticketID, oldTicketDetails['title'], ticketTitle]);
	} else {
		const oldTicketDetails = (await database.query('SELECT description FROM tickets WHERE ticket_id=$1;', [ticketID])).rows[0];
		await database.query('UPDATE tickets SET description=$1 WHERE ticket_id=$2;', [ticketDescription, ticketID]);
		await database.query('INSERT INTO ticketmodifications (ticket_id, old_description, new_description) VALUES ($1, $2, $3);', [ticketID, oldTicketDetails['description'], ticketDescription]);
	}

	res.json({
		status: 200,
		response: 'Succesfully modified ticket.',
	});
});

module.exports = app;
