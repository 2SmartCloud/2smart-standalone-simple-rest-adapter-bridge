const TopicsManager = require('../../TopicsManager');

const { validate } = require('../../utils');

class TopicsSet {
    static validationRules = {
        topic : [ 'required', 'string', 'mqtt_topic_object' ],
        value : [ 'string' ]
    }

    static async execute({ topic, value }) {
        const topicsManager = TopicsManager.getInstance();
        await topicsManager.set(topic, value);
    }

    static run(params) {
        const cleanParams = validate(this.validationRules, params);

        return this.execute(cleanParams);
    }
}

module.exports = TopicsSet;
