const bodyParser = require('body-parser');
const basicAuth  = require('express-basic-auth');

const { auth } = require('../etc/config');

const STATUS_CODES = require('./statusCodes');

module.exports = (app) => {
    app.use(bodyParser.json({
        limit  : 1024 * 1024,
        verify : (req, res, buf) => {
            try {
                JSON.parse(buf);
            } catch (e) {
                res.status(STATUS_CODES.BAD_REQUEST).end();
            }
        }
    }));
    app.use(bodyParser.urlencoded({ extended: true }));

    // configure basic auth
    if (auth.login && auth.password) {
        app.use(basicAuth({
            users     : { [auth.login]: auth.password },
            challenge : true
        }));
    } else if ((!auth.login && auth.password) || (auth.login && !auth.password)) {
        // exit with error
        throw new Error('Please, provide both basic auth credentials(login and password)');
    }
};
