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

const ticketsAPI = require('./api/tickets');
const userAPI = require('./api/user');

app.use(ticketsAPI);
app.use(userAPI);

module.exports = app;