const express = require('express');
const router = express.Router();

router.use('/users', require('./users'));
router.use('/countries', require('./countries'));

module.exports = router;