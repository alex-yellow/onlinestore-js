const mysql = require('mysql');
const { promisify } = require('util');

// Создание пула соединений
const db = mysql.createPool({
    connectionLimit: 10, // Количество соединений в пуле
    host: 'localhost',
    user: 'root',
    password: '', // Пустой пароль, измените, если у вас есть пароль
    database: 'onlinestore',
});

// Подключение к базе данных
db.getConnection((err, connection) => {
    if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('DATABASE_CONNECTION_WAS_CLOSED');
        }
        if (err.code === 'ER_CON_COUNT_ERRORS') {
            console.error('DATABASE_HAS_TOO_MANY_CONNECTIONS');
        }
        if (err.code === 'ECONNREFUSED') {
            console.error('DATABASE_CONNECTION_WAS_REFUSED');
        }
    }

    if (connection) {
        connection.release();
        console.log('DB is Connected');
    }

    return;
});

// Промисификация методов запроса
db.query = promisify(db.query);

module.exports = db;