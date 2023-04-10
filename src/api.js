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
const commentsAPI = require('./api/comments');

app.use(ticketsAPI);
app.use(userAPI);
app.use(commentsAPI);

module.exports = app;