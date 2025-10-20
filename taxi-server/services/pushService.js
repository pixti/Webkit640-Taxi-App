const admin = require('firebase-admin');
const db = require('../database/db_connect');

// FCM 메시지 전송 함수
const sendFcm = (fcmToken, msg) => {
    const message = {
        notification: {
            title: '알림',
            body: msg,
        },
        token: fcmToken,
    };

    admin
        .messaging()
        .send(message)
        .then((response) => {
            console.log('-- push 성공: ', response);
        })
        .catch((error) => {
            console.log('-- push error / ' + JSON.stringify(error));
        });
};

// 모든 Driver에게 푸시 메시지 전송
const sendPushToAllDriver = () => {
    let queryStr = 'SELECT fcm_token FROM tb_driver';
    console.log('>> querystr = ' + queryStr);
    db.query(queryStr, function (err, rows, fields) {
        if (!err) {
            for (const row of rows) {
                console.log('allDriver - fcm_token = ' + row.fcm_token);
                if (row.fcm_token) {
                    sendFcm(row.fcm_token, '배차 요청이 있습니다');
                }
            }
        } else {
            console.log('allDriver - err : ' + err);
        }
    });
};

// 특정 Taxi 앱 사용자에게 Push 전송
const sendPushToUser = (userId) => {
    let queryStr = `SELECT fcm_token FROM tb_user WHERE user_id="${userId}"`;
    console.log('>> push user - querystr = ' + queryStr);
    db.query(queryStr, function (err, rows, fields) {
        if (!err) {
            console.log('>> push user - >> rows = ' + JSON.stringify(rows));

            if (Object.keys(rows).length > 0 && rows[0].fcm_token) {
                sendFcm(rows[0].fcm_token, '배차가 완료되었습니다.');
            } else {
                console.log('Push 전송 실패: 해당 유저의 토큰이 없습니다.');
            }
        } else {
            console.log('>> push user - - err : ' + err);
        }
    });
};

// FCM 토큰 업데이트 공통 함수
const updateFcm = (fcmToken, table, idColName, id) => {
    if (!fcmToken) return; // 토큰이 없으면 업데이트하지 않음
    const queryStr = `UPDATE ${table} SET fcm_token="${fcmToken}" WHERE ${idColName}="${id}"`;
    console.log('>>>> updateFcm / queryStr = ' + queryStr);
    db.query(queryStr, function (err, rows, fields) {
        if (err) {
            console.log('updateFcm / err : ' + JSON.stringify(err));
        }
    });
};

// 다른 파일에서 이 함수들을 사용할 수 있도록 내보냅니다.
module.exports = {
    sendFcm,
    sendPushToAllDriver,
    sendPushToUser,
    updateFcm,
};
