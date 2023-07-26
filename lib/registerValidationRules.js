const LIVR       = require('livr');
const extraRules = require('livr-extra-rules');

/* eslint-disable no-param-reassign */
const defaultRules = {
    'primitive'() {
        return value => {
            if (value !== null && value !== undefined && !LIVR.util.isPrimitiveValue(value)) return 'NOT_PRIMITIVE';
        };
    },
    'mqtt_topic'() {
        // eslint-disable-next-line security/detect-unsafe-regex
        const regexp = /^\$?[0-9a-z-]+(\/\$?[0-9a-z-]+)*$/;

        return (topic) => {
            if (!regexp.test(topic)) return 'WRONG_TOPIC_FORMAT';
        };
    },
    'mqtt_topic_object'() {
        // eslint-disable-next-line security/detect-unsafe-regex
        const regexp = /^((\$?[0-9a-z-]+|\+)(\/(\$?[0-9a-z-]+|\+))*(\/#)?)|#|\+$/;

        return (to) => {
            if (!regexp.test(to)) return 'WRONG_TOPIC_OBJECT_FORMAT';
        };
    },
    'topics_object'() {
        const rules = arguments[arguments.length - 1];
        const topicValidator = rules.mqtt_topic();
        const primitiveValidator = rules.primitive();

        return (topics, params, outputArr) => {
            const result = {};
            const errors = {};

            // eslint-disable-next-line no-unused-vars
            for (const [ topic, value ] of Object.entries(topics)) {
                const error_topic_code = topicValidator(topic);

                if (error_topic_code) {
                    errors[topic] = error_topic_code;
                    continue;
                }

                const error_value_code = primitiveValidator(topic);

                if (error_value_code) {
                    errors[topic] = error_value_code;
                    continue;
                }

                result[topic] = (value !== null && value !== undefined) ? `${value}` : '';
            }

            if (Object.keys(errors).length) return errors;

            outputArr.push(result);
        };
    }
};

LIVR.Validator.registerDefaultRules({ ...defaultRules, ...extraRules });

