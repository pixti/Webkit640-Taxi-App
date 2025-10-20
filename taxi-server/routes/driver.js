const express = require('express');
const router = express.Router();
const db = require('../database/db_connect');
// 1. sendPushToUser 함수를 require 목록에 추가합니다.
const { updateFcm, sendPushToUser } = require('../services/pushService');

// Driver - Login
router.post('/login', function (req, res, next) {
    console.log('driver-login / req.body = ' + JSON.stringify(req.body));

    let userId = req.body.userId;
    let userPw = req.body.userPw;
    let fcmToken = req.body.fcmToken || '';

    let queryStr = `SELECT * FROM tb_driver WHERE driver_id="${userId}" AND driver_pw="${userPw}"`;
    console.log('driver-login / queryStr = ' + queryStr);
    db.query(queryStr, (err, rows, fields) => {
        if (!err) {
            console.log('driver-login / rows = ' + JSON.stringify(rows));
            let len = Object.keys(rows).length;
            console.log('driver-login / len = ' + len);
            let code = len == 0 ? 1 : 0;
            let message = len == 0 ? '아이디 또는 비밀번호가 잘못 입력되었습니다.' : '로그인 성공';

            if (code == 0) {
                updateFcm(fcmToken, 'tb_driver', 'driver_id', userId);
            }

            res.json([{ code: code, message: message }]);
        } else {
            console.log('driver-login / err: ' + err);
            res.json([{ code: 1, message: 'DB 오류 발생' }]);
        }
    });
});

// Driver 회원가입
router.post('/register', function (req, res) {
    console.log('driver-register / req.body = ' + JSON.stringify(req.body));
    let userId = req.body.userId;
    let userPw = req.body.userPw;
    let fcmToken = req.body.fcmToken || '';

    console.log('driver-register / userId = ' + userId + ', userPw = ' + userPw);
    if (!(userId && userPw)) {
        res.json([{ code: 1, message: '아이디 또는 비밀번호가 없습니다.' }]);
        return;
    }

    let queryStr = `INSERT INTO tb_driver VALUES("${userId}", "${userPw}", "${fcmToken}")`;
    console.log('driver-register / queryStr = ' + queryStr);
    db.query(queryStr, function (err, rows, fields) {
        if (!err) {
            console.log('driver-register / rows = ' + JSON.stringify(rows));
            res.json([{ code: 0, message: '회원가입이 완료되었습니다.' }]);
        } else {
            console.log('driver-register / err : ' + JSON.stringify(err));
            if (err.code == 'ER_DUP_ENTRY') {
                res.json([{ code: 2, message: '이미 등록된 ID 입니다.', data: err }]);
            } else {
                res.json([{ code: 3, message: '알수 없는 오류가 발생하였습니다.', data: err }]);
            }
        }
    });
});

// Driver - call list
router.post('/list', function (req, res) {
    console.log('driver-list / req.body ' + JSON.stringify(req.body));
    let userId = req.body.userId;
    console.log('driver-list / userId = ' + userId);

    let queryStr = `SELECT * FROM tb_call where driver_id="${userId}" OR call_state="REQ" ORDER BY id DESC`;
    console.log('driver-list / queryStr = ' + queryStr);

    db.query(queryStr, function (err, rows, fields) {
        if (!err) {
            console.log('driver-list / rows = ' + JSON.stringify(rows));
            let code = 0;
            res.json([{ code: code, message: '택시 호출 목록 호출 성공', data: rows }]);
        } else {
            console.log('driver-list / err : ' + err);
            res.json([{ code: 1, message: '알수 없는 오류가 발생하였습니다.', data: err }]);
        }
    });
});

// Driver - 배차
router.post('/accept', function (req, res) {
    console.log('driver-accept / req.body ' + JSON.stringify(req.body));
    let callId = req.body.callId;
    let driverId = req.body.driverId;
    let userId = req.body.userId || ''; // <-- 이 userId가 택시를 호출한 사용자 ID 입니다.
    console.log('driver-accept / callId = ' + callId + ', driverId = ' + driverId + ', userId = ' + userId);

    if (!(callId && driverId && userId)) {
        res.json([{ code: 1, message: 'callId, driverId 또는 userId가 없습니다.' }]);
        return;
    }

    let queryStr = `UPDATE tb_call set driver_id="${driverId}", call_state="RES" WHERE id=${callId}`;
    console.log('driver-accept / queryStr = ' + queryStr);

    db.query(queryStr, function (err, rows, fields) {
        if (!err) {
            console.log('driver-accept / rows = ' + JSON.stringify(rows));
            if (rows.affectedRows > 0) {
                // 2. 배차 성공 시, 택시를 호출한 사용자에게 푸시를 보냅니다.
                sendPushToUser(userId);
                res.json([{ code: 0, message: '배차가 완료되었습니다.' }]);
            } else {
                res.json([{ code: 2, message: '이미 완료되었거나 없는 Call 입니다.' }]);
            }
        } else {
            console.log('driver-accept / err : ' + JSON.stringify(err));
            res.json([{ code: 3, message: '알수 없는 오류가 발생하였습니다.', data: err }]);
        }
    });
});

module.exports = router;
