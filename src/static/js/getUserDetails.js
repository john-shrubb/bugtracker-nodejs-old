// This JS file simply grabs the details of the user accessing the page

async function getUserDetails() {
	return await new Promise(function(resolve) {
		const request = new XMLHttpRequest();
		request.open('get', '/api/user/details');
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