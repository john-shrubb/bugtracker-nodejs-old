/**
 * Create a project
 * POST endpoint
 * 
 * Request body should look like
 * {
 * 		"title": "abc"
 * }
 */

const Express = require('express');
const app = Express();

const database = require('../../db');
const getUserRole = require('../../utils/getUserRole');
const idgen = require('../../utils/idgen');

app.post('/api/projects/create', async (req, res) => {
	const userID = req.oidc.userID;

	const userRole = await getUserRole(userID);

	if (userRole <= 2) {
		res.statusCode = 403;
		res.json({
			status: 403,
			response: 'You are not allowed to create a new project!',
		});
		return;
	}

	const projectTitle = req.body['title'].trim();
	
	if (!projectTitle) {
		res.statusCode = 400;
		res.json({
			status: 400,
			response: 'Invalid or missing project title.',
		});
		return;
	}

	const projectID = idgen(15);

	await database.query('INSERT INTO projects (project_id, title, created_by) VALUES ($1, $2, $3);', [projectID, projectTitle, userID]);
	res.json({
		status: 200,
		response: projectID,
	});
});

module.exports = app;