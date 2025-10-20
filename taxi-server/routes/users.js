var express = require('express');
var router = express.Router();
const db = require('../database/db_connect');
const admin = require('firebase-admin');

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

module.exports = router;
