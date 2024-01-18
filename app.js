// Импорт необходимых модулей
const express = require('express');
const morgan = require('morgan');
const exphbs = require('express-handlebars');
const session = require('express-session');
const mysqlstore = require('express-mysql-session')(session);
const db = require('./db');
const bcrypt = require('bcryptjs');
const flash = require('connect-flash');

// Создание экземпляра приложения Express
const app = express();

//Подключение Handlebars
const handlebars = exphbs.create({
    defaultLayout: 'main',
    extname: 'hbs',
});

//Подключение Handlebars
app.engine('hbs', handlebars.engine);
app.set('view engine', 'hbs');

//Статические файлы
app.use(express.static('public'));


const sessionStore = new mysqlstore({
    expiration: 86400000, // Время жизни сессии в миллисекундах (в данном случае 1 день)
    createDatabaseTable: true, // Создать таблицу для сессий, если её нет
    schema: {
        tableName: 'sessions', // Название таблицы для сессий
    },
}, db);


//  Промежуточные обработчики (Middleware) 
// Использование сессии
app.use(session({
    secret: 'onlinestore',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
}));

// Использование morgan для логирования в разработке
app.use(morgan('dev'));
// Обработка данных из формы
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Подключение модуля для работы с flash-сообщениями
app.use(flash());

//Основная часть приложения

//Подключение роутов 

const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');
const orderRouter = require('./routes/orders');
const commentRouter = require('./routes/comment');
const messageRouter = require('./routes/messages');

//Инициализация роутов 
app.use('/', indexRouter);
app.use('/', authRouter);
app.use('/', adminRouter);
app.use('/', orderRouter);
app.use('/', commentRouter);
app.use('/', messageRouter);

// Запуск сервера 
app.listen(3000, function () {
    console.log('Server is running on port 3000');
});