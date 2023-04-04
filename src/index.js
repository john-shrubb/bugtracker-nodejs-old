// index.js

// Dependencies

const Express = require('express');
const app = Express();

const fs = require('fs');

// Basic config

const config = require('./config/webserver.json');

// Import database connection. Connected to PostgreSQL.

const database = require('./db');

// Connect with auth0 and add it onto the express app

const authmid = require('./auth0');
const { requiresAuth } = require('express-openid-connect');
app.use(authmid);

// Create a user cache. Holds details of 30 recent users to avoid repetitive calls to the database.
// Capped at 30 users to avoid memory leak.

const IDGen = (length) => {
    let id = '';
    for (let x = 0; x < length; x++) {
        id = id.concat(String(Math.ceil(Math.random() * 9)));
    }
    return id;
}

// Very basic root link. Should redirect to dashboard later in development.

app.use(async (req, res, next) => {
    if (!req.oidc.isAuthenticated) {
        return res.redirect('/login');
    }

    let rawQuery = await database.query('SELECT * FROM users WHERE auth0id = $1;', [req.oidc.user.sub]);

    if (!rawQuery.rowCount) {
        rawQuery = await database.query(
            'INSERT INTO users (user_id, username, role, auth0id, email) VALUES ($1, $2, $3, $4, $5);',
            [IDGen(15), req.oidc.user.name, 1, req.oidc.user.sub, req.oidc.user.email]
        );
    }

    rawQuery = await database.query('SELECT user_id FROM users WHERE auth0id = $1;', [req.oidc.user.sub]);

    req.oidc.userID = rawQuery.rows[0]['user_id'];
    next();
});

app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    const file = fs.readFileSync('./src/pages/dashboard.html');
    res.statusCode = 200;
    res.end(file.toString());
    console.log(req.oidc.userID);
});

// Mounts ./static to /assets on web server. Removes uneccessary manual pathing.

app.use('/assets', Express.static('src/static'));

// EXTREMELY basic error handling.

app.use((req, res) => {
    res.end('Error.');
})

// Start the web server up.

app.listen(
    config.prodport,
    '0.0.0.0',
    () => console.log('Server online on port ' + config.prodport)
);