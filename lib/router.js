const express     = require('express');
const controllers = require('./controllers');

const router = express.Router();

router.get('/topics', controllers.topics.get);
router.post('/topics/set', controllers.topics.set);

module.exports = router;
