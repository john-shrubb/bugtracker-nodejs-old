// index.js

// Dependencies

const Express = require('express');
const app = Express();

const fs = require('fs');

const config = require('./config/webserver.json');

const auth = require('./auth0');
const { requiresAuth } = require('express-openid-connect');
app.use(auth);

app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    const file = fs.readFileSync('./src/pages/dashboard.html');
    res.statusCode = 200;
    console.log(req.oidc.isAuthenticated());
    res.end(file.toString());
});


app.use('/assets', Express.static('src/static'));

app.use((req, res) => {
    res.end('Error.');
})

app.listen(
    config.prodport,
    '0.0.0.0',
    () => console.log('Server online on port ' + config.prodport)
);