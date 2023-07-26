const Debugger = require('homie-sdk/lib/utils/debugger');

const TopicsGet = require('../services/topics/Get');
const TopicsSet = require('../services/topics/Set');

const { ERROR_CODES } = require('../errors');
const STATUS_CODES    = require('../statusCodes');

const ERROR_CODES_TO_STATUS_CODES = {
    [ERROR_CODES.VALIDATION]    : STATUS_CODES.BAD_REQUEST,
    [ERROR_CODES.ACCESS_DENIED] : STATUS_CODES.FORBIDDEN
};

const debug = new Debugger(process.env.DEBUG || '');
debug.initEvents();

function getTopicsController(req, res) {
    try {
        const data = req.query; // retrieve target data from request

        const result = TopicsGet.run(data); // perform use case

        if (result) { // process the result
            res.send({ value: result });
        } else {
            res.sendStatus(STATUS_CODES.NOT_FOUND);
        }
    } catch (err) {
        debug.warning('SimpleRestAdapter.getTopicsController', err);

        const statusCode = ERROR_CODES_TO_STATUS_CODES[err.code] || STATUS_CODES.INTERNAL_SERVER_ERROR;
        res.sendStatus(statusCode);
    }
}

async function setTopicsController(req, res) {
    try {
        const data = req.body; // retrieve target data from request

        await TopicsSet.run(data); // perform use case

        res.sendStatus(STATUS_CODES.OK); // process the result
    } catch (err) {
        debug.warning('SimpleRestAdapter.setTopicsController', err);

        const statusCode = ERROR_CODES_TO_STATUS_CODES[err.code] || STATUS_CODES.INTERNAL_SERVER_ERROR;
        res.sendStatus(statusCode);
    }
}

module.exports = {
    get : getTopicsController,
    set : setTopicsController
};
