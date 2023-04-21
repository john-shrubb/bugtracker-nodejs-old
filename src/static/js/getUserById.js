// Create a user cache to prevent repetitive calls to the API

const userCache = {};

// Get user by ID
		
async function getUserById(userID) {
	return await new Promise(function (resolve) {
		if (!userCache[userID]) {
			const request = new XMLHttpRequest();
			request.open('post', '/api/users/get/id');
			request.setRequestHeader('Content-Type', 'application/json');
			request.send(JSON.stringify({
				userID: userID,
			}));
			request.onload = function() {
				const response = JSON.parse(request.responseText);
	
				if (response['status'] !== 200) {
					throw new Error('Response from API: ' + response['response']);
				}
				userCache[userID] = response['response'];
				console.log()
				resolve(userCache[userID]);
			};
		} else {
			resolve(userCache[userID]);
		}
	});
}