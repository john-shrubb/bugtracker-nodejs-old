/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
// Get user by ID
		
async function getUserById(userID) {
	return await new Promise(function (resolve) {
		const request = new XMLHttpRequest();
		request.open('post', '/api/users/get/id');
		request.setRequestHeader('Content-Type', 'application/json');
		request.send(JSON.stringify({
			userID: userID,
		}));
		request.onload = function() {
			resolve(JSON.parse(request.responseText));
		};
	});
}