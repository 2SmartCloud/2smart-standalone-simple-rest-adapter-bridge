module.exports = Object.freeze({
    server : {
        // eslint-disable-next-line no-magic-numbers
        PORT : process.env.APP_PORT || 6060
    },
    auth : {
        login    : process.env.BASIC_AUTH_LOGIN,
        password : process.env.BASIC_AUTH_PASSWORD
    }
});
