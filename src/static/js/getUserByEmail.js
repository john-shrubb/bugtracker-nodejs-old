// Get user by ID
		
async function getUserByEmail(emailToSearch) {
	return await new Promise(function (resolve) {
		const request = new XMLHttpRequest();
		request.open('post', '/api/users/get/email');
		request.setRequestHeader('Content-Type', 'application/json');
		request.send(JSON.stringify({
			userEmail: emailToSearch,
		}));
		request.onload = function() {
			const response = JSON.parse(request.responseText);
			if (response['status'] !== 200) {
				throw new Error('Response from API: ' + response['response']);
			}
			resolve(response['response']);
		};
	});
}