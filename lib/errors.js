const { ERROR_CODES: { TIMEOUT } } = require('homie-sdk/lib/etc/config');

const ERROR_CODES = {
    TIMEOUT,
    ACCESS_DENIED : 'ACCESS_DENIED',
    VALIDATION    : 'VALIDATION'
};

module.exports = {
    ERROR_CODES
};

