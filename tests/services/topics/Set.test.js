const request       = require('supertest');
const Debugger      = require('homie-sdk/lib/utils/debugger');
const app           = require('../../../app');
const TopicsManager = require('../../../lib/TopicsManager');

const { auth: { login, password } } = require('../../../etc/config');
const STATUS_CODES = require('../../../lib/statusCodes');

const debug = new Debugger(process.env.DEBUG || '');
debug.initEvents();

// eslint-disable-next-line no-magic-numbers
jest.setTimeout(15000);

describe('SET /topics/set', () => {
    let topicsManager = null;
    const setRoute = '/api/v1/topics/set';

    beforeAll(async () => {
        topicsManager = new TopicsManager({
            mqttConnection : {
                username : process.env.MQTT_USER,
                password : process.env.MQTT_PASS,
                uri      : process.env.MQTT_URI
            },
            allowedTopics : '#'
        });

        topicsManager.on('error', err => {
            debug.error(err);
            process.exit(1);
        });
        topicsManager.on('exit', (reason, exitCode) => {
            debug.info('SimpleRestAdapter.test: GET /topics', reason);
            process.exit(exitCode);
        });

        await topicsManager.init();

        require('../../../lib/registerValidationRules');
    });

    test('NEGATIVE: request without required "topic" and "value" parameters', async () => {
        const response = await request(app)
            .post(setRoute)
            .auth(login, password);

        expect(response.statusCode).toBe(STATUS_CODES.BAD_REQUEST);
    });

    test('NEGATIVE: request with wrong format topic', async () => {
        const response = await request(app)
            .post(setRoute)
            .send({ topic: '/', value: 'value' })
            .auth(login, password);

        expect(response.statusCode).toBe(STATUS_CODES.BAD_REQUEST);
    });

    test('NEGATIVE: request to set not allowed topic', async () => {
        topicsManager.setAllowedTopics([ '' ]);

        const response = await request(app)
            .post(setRoute)
            .send({ topic: 'a/b/c', value: 'value' })
            .auth(login, password);

        expect(response.statusCode).toBe(STATUS_CODES.FORBIDDEN);

        topicsManager.setAllowedTopics([ '#' ]);
    });

    test('NEGATIVE: timeout for setting allowed but wrong topic', async () => {
        const response = await request(app)
            .post(setRoute)
            .send({ topic: 'wrong/topic', value: 'value' })
            .auth(login, password);

        expect(response.statusCode).toBe(STATUS_CODES.INTERNAL_SERVER_ERROR);
    });

    test('POSITIVE: set allowed and correct topic', done => {
        const topicToSet = 'a/b/c';
        const valueToSet = 'value';

        topicsManager.transport.on('message', (topic, message) => {
            if (topic === `${topicToSet}/set`) {
                const value = message.toString();
                expect(value).toBe(valueToSet);
                done();
            }
        });

        // don't check the response status code because we don't use 2smart-core service for topic processing
        request(app)
            .post(setRoute)
            .expect(STATUS_CODES.INTERNAL_SERVER_ERROR)
            .send({ topic: topicToSet, value: valueToSet })
            .auth(login, password)
            .end();
    });
});
