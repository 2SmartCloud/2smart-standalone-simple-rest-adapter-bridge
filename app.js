const express  = require('express');

const mountMiddleware = require('./lib/middleware');
const router          = require('./lib/router');

const app = express();

mountMiddleware(app);
app.use('/api/v1', router);

module.exports = app;
