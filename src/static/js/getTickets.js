// List tickets up to a certain amount.
// Pass 0 as ticketCount to list all tickets

async function getTickets(ticketCount) {
	if (isNaN(ticketCount) || Number(ticketCount) < 0) {
		throw new TypeError('Invalid amount of tickets to return.');
	}
	return await new Promise(function (resolve) {
		const request = new XMLHttpRequest();
		request.open('get', '/api/tickets/list/' + ticketCount);
		request.send();
		request.onload = function() {
			const response = JSON.parse(request.responseText);
			if (response['status'] !== 200) {
				throw new Error(response['response']);
			}

			for (let ticketIndex in response['response']) {
				response['response'][ticketIndex]['created_on'] = new Date(response['response'][ticketIndex]['created_on']);
			}

			resolve(response['response']);
		};
	});
}