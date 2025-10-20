import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://111.11.11.11:3000', // API의 기본 URL
  timeout: 10000, // 요청의 타임아웃 시간 (ms)
});

export default {
  test() {
    return instance.get('/taxi/test');
  },

  login(id: string, pw: string, fcmToken: string) {
    return instance.post('/taxi/login', {userId: id, userPw: pw, fcmToken: fcmToken})
  },

  register(id: string, pw: string, fcmToken: string) {
    return instance.post('/taxi/register', {userId: id, userPw: pw, fcmToken: fcmToken})
  },

  list (id: string) {
    return instance.post('/taxi/list', {userId: id})
  },

  call (id: string, startLat: string, startLng: string, startAddr: string,
        endLat: string, endLng: string, endAddr: string) {
    return instance.post('/taxi/call', {userId: id,
      startLat: startLat, startLng: startLng, startAddr: startAddr,
      endLat: endLat, endLng: endLng, endAddr: endAddr})
  },

  accept(driverId: string, callId: number, userId: string) {
    return instance.post('/driver/accept', { driverId, callId, userId });
  },

}