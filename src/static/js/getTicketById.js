async function getTicketById(ticketID) {
	return await new Promise(function (resolve) {
		const request = new XMLHttpRequest();
		request.open('get', '/api/tickets/get/' + ticketID);
		request.send();

		request.onload = function() {
			const response = JSON.parse(request.responseText);
			if (response['status'] !== 200) {
				throw new Error('Response from API: ' + response['response']);
			}

			resolve(response['response']);
		};
	});
}