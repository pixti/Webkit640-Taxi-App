var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var taxiRouter = require('./routes/taxi');
var driverRouter = require('./routes/driver');

var app = express();

// DB 접속
const db = require('./database/db_connect');
db.connect();

// FCM 푸시 인증서
var admin = require('firebase-admin');
admin.initializeApp({
    credential: admin.credential.cert(require('./call-taxi-ServiceAccountKey.json')),
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/taxi', taxiRouter);
app.use('/driver', driverRouter);

// catch 44 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

// push - test
app.post('/push/test', function (req, res, next) {
    console.log('push-test / req.body ' + JSON.stringify(req.body));
    let fcmToken = req.body.fcmToken;
    let message = req.body.message;
    sendFcm(fcmToken, message);
    res.json([{ code: 0, message: '푸시테스트' }]);
});

const sendFcm = (fcmToken, msg) => {
    const message = { notification: { title: '알림', body: msg }, token: fcmToken };
    admin
        .messaging()
        .send(message)
        .then((response) => {
            console.log('-- push 성공');
        })
        .catch((error) => {
            console.log('-- push error / ' + JSON.stringify(error));
        });
};

module.exports = app;
