const db = require('mysql');
const conn = db.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: 'root',
    database: 'taxi',
});
module.exports = conn;
