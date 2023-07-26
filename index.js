const Debugger = require('homie-sdk/lib/utils/debugger');

const { server }    = require('./etc/config');
const TopicsManager = require('./lib/TopicsManager');
const app           = require('./app');

const debug = new Debugger(process.env.DEBUG || '');
debug.initEvents();

(async () => {
    const topicsManager = new TopicsManager({ // initialize singleton class
        mqttConnection : {
            username : process.env.MQTT_USER,
            password : process.env.MQTT_PASS,
            uri      : process.env.MQTT_URI
        },
        allowedTopics : process.env.ALLOWED_TOPICS
    });

    topicsManager.on('error', err => {
        debug.error(err);
    });
    topicsManager.on('exit', (reason, exitCode) => {
        debug.info('SimpleRestAdapter.exit', reason);
        process.exit(exitCode);
    });

    await topicsManager.init();

    require('./lib/registerValidationRules');

    app.listen(server.PORT, () => {
        debug.info('SimpleRestAdapter.listen', `APP STARTING AT PORT ${server.PORT}`);
    });
})();
