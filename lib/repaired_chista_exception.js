const X = require('chista/Exception').default;

class RepairedChistaException extends X {
    constructor(data) {
        if (data instanceof X) super(X);
        else {
            super({
                message : data.message || 'Something went wrong',
                code    : data.code || 'UNKNOWN_ERROR',
                fields  : data.fields || {}
            });
        }
    }
}

module.exports = RepairedChistaException;
