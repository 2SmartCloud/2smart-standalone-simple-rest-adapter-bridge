const EventEmitter  = require('events');
const MQTTTransport = require('homie-sdk/lib/Broker/mqtt');
const Homie         = require('homie-sdk/lib/homie/Homie');

const { ERROR_TOPIC } = require('homie-sdk/lib/homie/Homie/config');
const X               = require('./repaired_chista_exception');

const { ERROR_CODES } = require('./errors');

const TIMEOUT_TIME = 10000;

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

class TopicsManager extends EventEmitter {
    constructor({ mqttConnection, allowedTopics = '#' }) {
        const { instance } = TopicsManager; // singleton class
        // eslint-disable-next-line no-constructor-return
        if (instance) return instance;

        super();
        TopicsManager.instance = this;

        this.handleMessage = this.handleMessage.bind(this);
        const transport = new MQTTTransport({
            username : '',
            // eslint-disable-next-line more/no-hardcoded-password
            password : '',
            uri      : 'mqtt://localhost:1883',
            ...mqttConnection
        });
        const homie = new Homie({ transport });

        this.initialized = false;
        this.online = false;
        this.topics = {};
        this.transport = transport;
        this.homie = homie;
        this.transport.on('message', this.handleMessage);
        // allowed topics comes from config as comma separated string with topics
        // Example of absolute topics:
        //     "sweet-home/device-id/node-id/sensor-id,sweet-home/device-id/node-id/$options/option-id"
        // Example of topics with wildcards:
        //     "sweet-home/first-device-id/#,sweet-home/second-device-id/#"
        this.allowedTopics = allowedTopics.split(',').map(topic => topic.trim());
    }

    static getInstance() {
        return TopicsManager.instance;
    }

    setAllowedTopics(allowedTopics) {
        this.allowedTopics = allowedTopics;
    }

    buildRegExpForWildcardTopic(topic) {
        const topicLevels = topic.split('/');
        const plusRegExp = '[^/]+';

        // eslint-disable-next-line more/no-c-like-loops
        for (let i = 0; i < topicLevels.length; i++) {
            if (i === topicLevels.length - 1 && topicLevels[i] === '#') {
                topicLevels[i] = `${plusRegExp}(/${plusRegExp})*`;
            } else if (topicLevels[i] === '+') {
                topicLevels[i] = plusRegExp;
            } else {
                topicLevels[i] = escapeRegExp(topicLevels[i]);
            }
        }

        // build from mqtt wildcards syntax js-RegExp object
        const regExpStr = `^${topicLevels.join('/')}$`;

        // eslint-disable-next-line security/detect-non-literal-regexp
        const regExp = new RegExp(regExpStr);

        return regExp;
    }

    isWildcardTopic(topic) {
        const topicLevels = topic.split('/');

        return topicLevels.includes('+') || topicLevels[topicLevels.length - 1] === '#';
    }

    checkAllowedTopic(topic) {
        const isAllowedTopic = this.allowedTopics
            .filter(this.isWildcardTopic.bind(this))
            .map(this.buildRegExpForWildcardTopic.bind(this))
            .some(allowedTopicRegExp => allowedTopicRegExp.test(topic));

        if (!isAllowedTopic) {
            throw new X({
                code    : ERROR_CODES.ACCESS_DENIED,
                message : 'Not allowed topic'
            });
        }
    }

    getTopicValue(topic) {
        this.checkAllowedTopic(topic);

        return this.topics[topic];
    }

    async init() {
        // istanbul ignore next
        try {
            await this.homie.init(null, this.allowedTopics);
            this.initialized = true;
        } catch (error) {
            // istanbul ignore next
            this.emit('error', error);
            // istanbul ignore next
            this.emit('exit', error, 1);
        }
    }

    destroy() {
        this.initialized = false;
        this.homie.end();
    }

    // async
    async set(topic, value, errorTimeout = TIMEOUT_TIME) {
        this.checkAllowedTopic(topic);

        let resolve;
        let reject;

        const promise = new Promise((_resolve, _reject) => {
            resolve = _resolve;
            reject = _reject;
        });

        const clear = () => {
            clearTimeout(tId);
            this.transport.off('message', onMessage);
        };

        // eslint-disable-next-line func-style
        const onMessage = (t, message) => {
            if (t === topic) {
                clear();
                resolve(message.toString());
            } else if (`${ERROR_TOPIC}/${topic}` === t) {
                clear();
                let error = message.toString();

                try {
                    error = new X(JSON.parse(error));
                } catch (e) {
                    error = new X(error);
                }

                reject(error);
            }
        };

        const tId = setTimeout(() => {
            clear();
            reject(new X({ code: ERROR_CODES.TIMEOUT, message: `Too long waiting for response while set the topic ${topic}` }));
        }, errorTimeout);

        this.transport.on('message', onMessage);

        this.homie.publishToBroker(`${topic}/set`, value, { retain: false });

        return promise;
    }

    async handleMessage(topic, message) {
        const value = message.toString();
        if (value) this.topics[topic] = value;
        else delete this.topics[topic];
    }
}

module.exports = TopicsManager;
