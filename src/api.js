/**
 * api.js
 * 
 * Provide API endpoints for the front end to connect to
 */

const Express = require('express');
const app = Express();

app.use((req, res, next) => {
	res.statusCode = 200;
	next();
});

app.use(Express.json());

const fs = require('fs');

const apiDirs = ['comments', 'tickets', 'users'];

apiDirs.forEach(async directory => {
	let endpoints = fs.readdirSync(__dirname + '/api/' + directory);
	endpoints = endpoints.filter(value => {
		return value.endsWith('.js');
	});

	endpoints.forEach(value => {
		app.use(require(__dirname + '/api/' + directory + '/' + value));
	});
});

module.exports = app;