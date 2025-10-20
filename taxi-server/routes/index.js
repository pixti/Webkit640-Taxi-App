var express = require('express');
var router = express.Router();
const db = require('../database/db_connect');
const admin = require('firebase-admin');

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', { title: 'Express' });
});

module.exports = router;
