/**
 * comments.js
 * 
 * All endpoints for everything to do with comments left on
 * tickets.
 * 
 * Tickets themselves are dealt with in ./tickets.js
 */

const Express = require('express');
const app = Express();

const database = require('../db');

const IDGen = require('../utils/idgen');
const verifyIDFormat = require('../utils/verifyIDFormat');
const canAccessTicket = require('../utils/canAccessTicket');

/**
 * List comments on a ticket
 * GET endpoint
 * 
 * Note: A presence check is not required for this endpoint
 *       because trying to GET /api/v1/comments/get/ turns up a
 *       404 automatically.
 */

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

	const ticketOwner = await (database.query('SELECT user_id FROM tickets WHERE ticket_id=$1;', [ticketID])).rows[0];

	if (!ticketOwner) {
		res.status = 404;
		res.json({
			status: 404,
			response: 'The ticket was not found or you are forbidden from accessing it.',
		});
		return;
	}

	const userRole = await (database.query('SELECT role FROM users WHERE user_id=$1', [req.oidc.userID])).rows[0]['role'];
	if (userRole === 1 && ticketOwner['user_id'] !== req.oidc.userID) {
		const assignedTickets = await (database.query('SELECT * FROM userassignments WHERE user_id=$1;', [req.oidc.userID])).rows;
		if (!assignedTickets) {
			res.statusCode = 404;
			res.json({
				status: 404,
				response: 'The ticket was not found or you are forbidden from accessing it.',
			});
			return;
		}
	}

	const allComments = await (database.query('SELECT * FROM comments WHERE ticket_id=$1', [ticketID])).rows;

	const response = {
		status: 200,
		response: allComments,
	};

	res.json(response);
});

/**
 * Create a comment on a ticket
 * 
 * :ticketid should be the ID of the ticket you are wanting to
 * creat the comment for.
 * 
 * Request body should look like
 * {
 * 		"content": "Marked as fixed :)"
 * }
 */

app.post('/api/comments/create/:ticketid', async (req, res) => {
	const ticketID = req.params.ticketid;
	const userID = req.oidc.userID;

	const commentContent = req.body['content'].trim();

	if (!verifyIDFormat(ticketID)) {
		res.statusCode = 400;
		res.json({
			status: 400,
			response: 'Invalid ticket ID',
		});
		return;
	}

	if (!commentContent) {
		res.statusCode = 400,
		res.json({
			status: 400,
			response: 'Cannot create an empty comment!',
		});
		return;
	}

	const ticketDetails = (await database.query('SELECT * FROM tickets WHERE ticket_id=$1;', [ticketID])).rows;
	if (!ticketDetails.length || !await canAccessTicket(userID, ticketID)) {
		res.statusCode = 403;
		res.json({
			status: 403,
			response: 'Ticket either doesn\'t exist or you have insufficient permissions to create a comment on it.',
		});
		return;
	}
	let commentID;
	let validID = false; // Part of below validation

	// Validation to ensure that there are no duplicate comment
	// IDs in the table.

	while (!validID) {
		commentID = IDGen(15);
		validID = (await database.query('SELECT * FROM comments WHERE comment_id=$1;', [commentID])).rows[0] ? false : true;
	}

	await database.query('INSERT INTO comments (comment_id, ticket_id, user_id, content) VALUES ($1, $2, $3, $4);', [commentID, ticketID, req.oidc.userID, commentContent]);

	res.json({
		status: 200,
		response: commentID,
	});
});

module.exports = app;