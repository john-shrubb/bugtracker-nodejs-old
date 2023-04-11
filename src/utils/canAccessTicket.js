const IDFormatChecker = require('./verifyIDFormat');
const database = require('../db');

const canAccessTicket = async (userID, ticketID) => {
	// Check the format of the userID and ticketID to ensure
	// that they are a valid format.
	if (!IDFormatChecker(userID) || !IDFormatChecker(ticketID)) {
		throw new Error('User ID and/or ticket ID are not in a valid format.');
	}

	// Get the user's role, and also check they exist
	console.log('a');

	const userRole = (await database.query('SELECT role FROM users WHERE user_id=$1;', [userID])).rows[0];

	// Error if user does not exist.

	if (!userRole) {
		throw new Error('Passed user does not exist!');
	}

	// Managers and owners can see all tickets.

	if (userRole['role'] !== 1) {
		return true;
	}

	// Check that the user is the ticket owner.

	const ticketOwner = (await database.query('SELECT user_id FROM tickets WHERE ticket_id=$1;', [ticketID])).rows[0];

	if (!ticketOwner) {
		throw new Error('Ticket does not exist!');
	}

	if (ticketOwner['user_id'] === userID) {
		return true;
	}

	const userAssignments = (await database.query('SELECT * FROM userassignments WHERE ticket_id=$1 AND user_id=$2;', [ticketID, userID])).rows;

	if (!userAssignments.length) {
		return false;
	}

	return true;
};

module.exports = canAccessTicket;