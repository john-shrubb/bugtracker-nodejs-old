/* eslint-disable no-undef */
// Update username header in top right of page

async function updateUsername() {
	const request = new XMLHttpRequest();
	request.open('get', '/api/user/details');
	request.send();
	request.onload = function() {
		const userDetails = JSON.parse(request.responseText)['response'];
		document.getElementById('top-title-bar-username').innerHTML = userDetails['username'];
	};
}

updateUsername();