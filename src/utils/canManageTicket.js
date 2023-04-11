/**
 * canManageTicket.js
 * 
 * Checks if a user if allowed to manage a ticket. They can do
 * this if they either own the ticket or they are a manager/owner
 * 
 * Should be used to:
 * - Check a user can mark tickets as closed, WiP or open
 * - Check if a user can delete tickets that are not theirs
 * - Check if a user can delete comments on tickets that are not
 *   theirs
 * 
 * ONLY the ticket owner can edit details like the ticket title
 * or description
 */

// Import dependencies

const IDFormatChecker = require('./verifyIDFormat');
const database = require('../db');

const canManageTicket = async (userID, ticketID) => {
	if (!IDFormatChecker(userID) || !IDFormatChecker(ticketID)) {
		throw new Error('Invalid format for user ID and/or ticketID');
	}

	const userDetails = (await database.query('SELECT role FROM users WHERE user_id=$1;', [userID])).rows[0];

	if (!userDetails) {
		throw new Error('User does not exist!');
	}

	const ticketOwnerID = (await database.query('SELECT user_id FROM tickets WHERE ticket_id=$1', [ticketID])).rows[0];

	if (!ticketOwnerID) {
		throw new Error('Ticket does not exist!');
	}

	// The reason this is after the ticket check is the user
	// CANNOT manage a non existent ticket. Presence checks on
	// both the ticket and the user should be done first.

	if (userDetails['role'] !== 1 || userID === ticketOwnerID['user_id']) return true;

	return false;
};

module.exports = canManageTicket;