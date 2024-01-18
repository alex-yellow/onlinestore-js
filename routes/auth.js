const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');


// Рендеринг страницы регистрации
router.get('/register', async (req, res) => {
    try {
        res.render('auth/register', { title: 'Register' });
    } catch (error) {
        console.error('Ошибка при рендеринге страницы регистрации:', error);
        res.status(500).send('Ошибка сервера');
    }
});

// Обработка данных регистрации
router.post('/register', async (req, res) => {
    try {
        const { name, password } = req.body;
        // Валидация данных
        if (!name || !password) {
            return res.render('auth/register', { error: 'Please provide both name and password' });
        }

        // Проверка существования пользователя с таким именем
        const existingUsers = await db.query('SELECT * FROM users WHERE name = ?', [name]);

        if (existingUsers.length > 0) {
            return res.render('auth/register', { error: 'User with this name already exists' });
        }

        // Хеширование пароля
        const hashedPassword = await bcrypt.hash(password, 10);

        // Создание нового пользователя
        await db.query('INSERT INTO users (name, password) VALUES (?, ?)', [name, hashedPassword]);

        req.session.successreg = 'Registration completed success';
        res.redirect('/login');
    } catch (error) {
        console.error('Ошибка при обработке данных регистрации:', error);
        res.render('auth/register', { error: 'Unexpected error' });
    }
});

// Рендеринг страницы входа
router.get('/login', async (req, res) => {
    try {
        const successReg = req.session.successreg;
        delete req.session.successreg;
        res.render('auth/login', { successReg, title: 'Login' });
    } catch (error) {
        console.error('Ошибка при рендеринге страницы входа:', error);
        res.status(500).send('Ошибка сервера');
    }
});

// Обработка данных входа
router.post('/login', async (req, res) => {
    try {
        const { name, password } = req.body;
        // Валидация данных
        if (!name || !password) {
            return res.render('auth/login', { error: 'Please provide both name and password' });
        }

        // Поиск пользователя по имени
        const users = await db.query('SELECT * FROM users WHERE name = ?', [name]);

        const user = users[0];

        // Проверка пароля
        if (user) {
            const passwordMatch = await bcrypt.compare(password, user.password);

            if (passwordMatch) {
                // Аутентификация успешна
                req.session.user = user;
                res.redirect('/');
            } else {
                res.render('auth/login', { error: 'Invalid name or password' });
            }
        } else {
            res.render('auth/login', { error: 'Invalid name or password' });
        }
    } catch (error) {
        console.error('Ошибка при обработке данных входа:', error);
        res.render('auth/login', { error: 'Unexpected error' });
    }
});

// Выход
router.get('/logout', async (req, res) => {
    try {
        req.session.destroy();
        res.redirect('/login');
    } catch (error) {
        console.error('Ошибка при выходе:', error);
        res.status(500).send('Ошибка сервера');
    }
});

module.exports = router;