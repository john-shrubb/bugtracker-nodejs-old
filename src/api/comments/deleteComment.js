const Express = require('express');
const app = Express();

const database = require('../../db');

app.get('/api/comments/delete/:id', async (req, res) => {
	const userID = req.oidc.userID;
	const commentID = req.params['id'];

	const userRole = (await database.query('SELECT role FROM users WHERE user_id=$1;', [userID])).rows[0]['role'];

	const commentOwner = (await database.query('SELECT * FROM comments WHERE user_id=$1 AND comment_id=$2;', [userID, commentID])).rows[0];

	if (!commentOwner && userRole === 1) {
		res.statusCode = 403;
		res.json({
			status: 403,
			response: 'You are either not allowed to delete this comment or it does not exist.',
		});
		return;
	}

	await database.query('DELETE FROM comments WHERE comment_id=$1', [commentID]);
	res.json({
		status: 200,
		response: 'Comment deleted.',
	});
});

module.exports = app;