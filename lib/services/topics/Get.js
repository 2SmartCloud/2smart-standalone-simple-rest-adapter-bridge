const TopicsManager = require('../../TopicsManager');

const { validate } = require('../../utils');

class TopicsGet {
    static validationRules = {
        topic : [ 'required', 'string', 'mqtt_topic_object' ]
    }

    static execute({ topic }) {
        const topicsManager = TopicsManager.getInstance();
        // eslint-disable-next-line no-param-reassign
        const topicValue = topicsManager.getTopicValue(topic);

        return topicValue;
    }

    static run(params) {
        const cleanParams = validate(this.validationRules, params);

        return this.execute(cleanParams);
    }
}

module.exports = TopicsGet;
