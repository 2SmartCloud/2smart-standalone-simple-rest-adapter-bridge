const LIVR = require('livr');
const X    = require('./repaired_chista_exception');

const { ERROR_CODES } = require('./errors');

function validate(validationRules, data) {
    const validator = new LIVR.Validator(validationRules);
    const validData = validator.validate(data);

    if (!validData) {
        throw new X({
            code   : ERROR_CODES.VALIDATION,
            fields : validator.getErrors()
        });
    }

    return validData;
}

module.exports = {
    validate
};
