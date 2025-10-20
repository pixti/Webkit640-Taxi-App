const express = require('express');
const router = express.Router();
const db = require('../database/db_connect');
const { sendFcm, sendPushToAllDriver, updateFcm } = require('../services/pushService');

router.get('/test', function (req, res, next) {
    db.query('select * from tb_user', (err, rows, fields) => {
        if (!err) {
            console.log('test / rows = ' + JSON.stringify(rows));
            res.json([{ code: 0, data: rows }]);
        } else {
            console.log('test / err: ' + err);
            res.json([{ code: 1, data: err }]);
        }
    });
});

// call list
router.post('/list', function (req, res) {
    console.log('list / req.body ' + JSON.stringify(req.body));
    let userId = req.body.userId;
    console.log('list / userId = ' + userId);

    let queryStr = `SELECT * FROM tb_call where user_id="${userId}" ORDER BY id DESC`;
    console.log('list / queryStr = ' + queryStr);

    db.query(queryStr, function (err, rows, fields) {
        if (!err) {
            console.log('list / rows = ' + JSON.stringify(rows));
            let code = 0;
            res.json([{ code: code, message: '택시 호출 목록 호출 성공', data: rows }]);
        } else {
            console.log('err : ' + err);
            res.json([{ code: 1, message: '알수 없는 오류가 발생하였습니다.', data: err }]);
        }
    });
});

// 택시 call
router.post('/call', function (req, res) {
    console.log('call / req.body ' + JSON.stringify(req.body));
    let userId = req.body.userId;
    let startAddr = req.body.startAddr;
    let startLat = req.body.startLat;
    let startLng = req.body.startLng;
    let endAddr = req.body.endAddr;
    let endLat = req.body.endLat;
    let endLng = req.body.endLng;

    if (!(userId && startAddr && startLat && startLng && endAddr && endLat && endLng)) {
        res.json([{ code: 1, message: '출발지 또는 도착지 정보가 없습니다.' }]);
        return;
    }

    let queryStr = `INSERT INTO tb_call VALUES(NULL, "${userId}", "${startLat}", "${startLng}", "${startAddr}", "${endLat}", "${endLng}", "${endAddr}", "REQ", "")`;
    console.log('call / queryStr = ' + queryStr);
    db.query(queryStr, function (err, rows, fields) {
        if (!err) {
            console.log('call / rows = ' + JSON.stringify(rows));
            // Driver 앱에 푸시 전송
            sendPushToAllDriver();
            res.json([{ code: 0, message: '택시 호출이 완료되었습니다.' }]);
        } else {
            console.log('call / err : ' + JSON.stringify(err));
            res.json([{ code: 2, message: '택시 호출이 실패했습니다.', data: err }]);
        }
    });
});

// Login
router.post('/login', function (req, res, next) {
    console.log('login / req.body = ' + JSON.stringify(req.body));

    let userId = req.body.userId;
    let userPw = req.body.userPw;
    let fcmToken = req.body.fcmToken || '';

    let queryStr = `SELECT * FROM tb_user WHERE user_id="${userId}" AND user_pw="${userPw}"`;
    console.log('login / queryStr = ' + queryStr);
    db.query(queryStr, (err, rows, fields) => {
        if (!err) {
            console.log('login / rows = ' + JSON.stringify(rows));
            let len = Object.keys(rows).length;
            console.log('login / len = ' + len);
            let code = len == 0 ? 1 : 0;
            let message = len == 0 ? '아이디 또는 비밀번호가 잘못 입력되었습니다.' : '로그인 성공';

            // 로그인 성공 시 fcm 토큰 업데이트
            if (code == 0) {
                updateFcm(fcmToken, 'tb_user', 'user_id', userId);
            }

            res.json([{ code: code, message: message }]);
        } else {
            console.log('login / err: ' + err);
            res.json([{ code: 1, message: 'DB 오류 발생' }]);
        }
    });
});

// 회원가입
router.post('/register', function (req, res) {
    console.log('register / req.body = ' + JSON.stringify(req.body));
    let userId = req.body.userId;
    let userPw = req.body.userPw;
    let fcmToken = req.body.fcmToken || '';

    console.log('register / userId = ' + userId + ', userPw = ' + userPw);
    if (!(userId && userPw)) {
        res.json([{ code: 1, message: '아이디 또는 비밀번호가 없습니다.' }]);
        return;
    }

    let queryStr = `INSERT INTO tb_user VALUES("${userId}", "${userPw}", "${fcmToken}")`;
    console.log('register / queryStr = ' + queryStr);
    db.query(queryStr, function (err, rows, fields) {
        if (!err) {
            console.log('register / rows = ' + JSON.stringify(rows));
            res.json([{ code: 0, message: '회원가입이 완료되었습니다.' }]);
        } else {
            console.log('register / err : ' + JSON.stringify(err));
            if (err.code == 'ER_DUP_ENTRY') {
                res.json([{ code: 2, message: '이미 등록된 ID 입니다.', data: err }]);
            } else {
                res.json([{ code: 3, message: '알수 없는 오류가 발생하였습니다.', data: err }]);
            }
        }
    });
});

// push - test API 라우터
router.post('/push/test', function (req, res, next) {
    console.log('push-test / req.body ' + JSON.stringify(req.body));
    let fcmToken = req.body.fcmToken;
    let message = req.body.message;

    if (!fcmToken || !message) {
        return res.json([{ code: 1, message: 'fcmToken 또는 message가 없습니다.' }]);
    }

    sendFcm(fcmToken, message);
    res.json([{ code: 0, message: '푸시 테스트 메시지를 전송 요청했습니다.' }]);
});

module.exports = router;
