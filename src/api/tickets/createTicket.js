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

const Express = require('express');
const app = Express();

const database = require('../../db');

const IDGen = require ('../../utils/idgen');

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

	const ticketTitle = req.body['title'].trimEnd().trim();
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


module.exports = app;