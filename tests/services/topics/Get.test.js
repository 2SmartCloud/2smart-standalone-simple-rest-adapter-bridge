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

describe('GET /topics', () => {
    let topicsManager = null;
    const getRoute = '/api/v1/topics';

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

    test('NEGATIVE: not authorized GET request', async () => {
        const response = await request(app)
            .get(getRoute)
            .auth('', '');

        expect(response.statusCode).toBe(STATUS_CODES.UNAUTHORIZED);
    });

    test('NEGATIVE: request without required "topic" query parameter', async () => {
        const response = await request(app)
            .get(getRoute)
            .auth(login, password);

        expect(response.statusCode).toBe(STATUS_CODES.BAD_REQUEST);
    });

    test('NEGATIVE: request with wrong format topic', async () => {
        const response = await request(app)
            .get(getRoute)
            .query({ topic: '/' })
            .auth(login, password);

        expect(response.statusCode).toBe(STATUS_CODES.BAD_REQUEST);
    });

    test('NEGATIVE: request to get not allowed topic', async () => {
        topicsManager.setAllowedTopics([ '' ]);

        const response = await request(app)
            .get(getRoute)
            .query({ topic: 'a/b/c' })
            .auth(login, password);

        expect(response.statusCode).toBe(STATUS_CODES.FORBIDDEN);

        topicsManager.setAllowedTopics([ '#' ]);
    });

    test('POSITIVE: get allowed but nonexistent topic', async () => {
        const response = await request(app)
            .get(getRoute)
            .query({ topic: 'non/existent/topic' })
            .auth(login, password);

        expect(response.statusCode).toBe(STATUS_CODES.NOT_FOUND);
    });

    test('POSITIVE: get allowed and existent topic', async () => {
        const topic = 'a/b/c';
        const value = 'value';
        topicsManager.handleMessage(topic, Buffer.from(value));

        const response = await request(app)
            .get(getRoute)
            .query({ topic })
            .auth(login, password);

        expect(response.statusCode).toBe(STATUS_CODES.OK);
        expect(response.body).toEqual({ value });

        topicsManager.handleMessage(topic, '');
    });
});
