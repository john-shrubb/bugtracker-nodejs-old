// index.js

// Dependencies

const Express = require('express');
const app = Express();

const config = require('./config/webserver.json');

// Simple hello world

app.get('/', (req, res) => {
    res.end('<h1>Hello</h1>');
});

app.use('/assets', Express.static('src/static'));

app.listen(config.prodport);