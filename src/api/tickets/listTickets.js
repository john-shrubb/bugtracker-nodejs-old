/**
 * List all available tickets
 * GET endpoint
 * 
 * :count should be the amount of tickets the user wants to list
 */

const Express = require('express');
const app = Express();

const database = require('../../db');
const canAccessTicket = require('../../utils/canAccessTicket');

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

module.exports = app;