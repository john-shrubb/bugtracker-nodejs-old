const Express = require('express');
const app = Express();

const { auth } = require('express-openid-connect');
const config = require('./config/auth0.json');
require('dotenv').config();

app.use(auth({
	authRequired: config.authRequired,
	auth0Logout: config.auth0Logout,
	baseURL: config.baseURL,
	issuerBaseURL: process.env.AUTH0ISSUERURL,
	clientID: process.env.AUTH0CLIENTID,
	secret: process.env.AUTH0SECRET,
}));

module.exports = app;