const express = require('express');
const router = express.Router();
const db = require('../db');
const isUser = require('../middleware/isUser');
const { isAdmin } = require('../middleware/isAdmin');



// Маршрут для отображения всех сообщений для данного пользователя
router.get('/users/messages/:userId', isUser, async (req, res) => {
    try {
        res.locals.user = req.session.user;
        // Получение сообщения из сессии
        const successMessage = req.session.successMessage;
        // Очистка сообщения в сессии после его использования
        delete req.session.successMessage;
        // Получаем информацию о пользователе по userId
        const userId = req.params.userId;
        const user = await db.query('SELECT * FROM users WHERE id = ?', [userId]);

        if (!user || user.length === 0) {
            return res.status(404).send('User not found');
        }

        // Получаем все сообщения для данного пользователя из БД
        const messages = await db.query('SELECT * FROM messages2 WHERE user_id = ?', [userId]);

        res.render('messages/userMessages', {
            user: user[0], // Передаем информацию о пользователе на страницу
            messages: messages, // Передаем все сообщения на страницу
            title: 'User Messages',
            successMessage
        });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Маршрут для отображения страницы отправки сообщения
router.get('/admin/users/send-message/:userId', isAdmin, async (req, res) => {
    try {
        res.locals.user = req.session.user;
        res.locals.admin = req.session.admin;

        // Получаем информацию о пользователе по userId
        const userId = req.params.userId;
        const user = await db.query('SELECT * FROM users WHERE id = ?', [userId]);

        if (!user || user.length === 0) {
            return res.status(404).send('User not found');
        }

        res.render('messages/adminToUser', {
            user: user[0], // Передаем информацию о пользователе на страницу
            title: 'Send Message'
        });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Маршрут для обработки POST-запроса на добавление сообщения в БД
router.post('/admin/users/send-message/:userId', isAdmin, async (req, res) => {
    try {
        const userId = req.params.userId;
        const messageText = req.body.messageText;
        res.locals.admin = req.session.admin;

        // Проверка наличия текста сообщения
        if (!messageText) {
            return res.status(400).send('Message text is required');
        }

        // Проверка наличия информации об админе
        if (!res.locals.admin || !res.locals.admin.id) {
            return res.status(403).send('Admin information is missing');
        }

        // Добавление сообщения в БД
        await db.query('INSERT INTO messages2 (admin_id, user_id, message_text) VALUES (?, ?, ?)',
            [res.locals.admin.id, userId, messageText]);
            const successMessage = 'Message delivered success!';
            req.session.successMessage = successMessage;
            res.redirect(`/admins/messages/${res.locals.admin.id}`);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send(`Internal Server Error: ${err.message}`);
    }
});

// Рендеринг главной страницы списка админов
router.get('/user/admins', isUser, async (req, res) => {
    try {
        res.locals.user = req.session.user;
        // Асинхронный запрос к базе данных для получения списка продуктов
        const results = await db.query('SELECT * FROM admins');
        res.render('messages/admin', { admin: results,  title:'Admins' });
    } catch (err) {
        // Обработка ошибок
        console.error('Ошибка при получении списка админов:', err);
        res.status(500).send('Ошибка сервера');
    }
});

// Маршрут для отображения всех сообщений для данного админа
router.get('/admins/messages/:adminId', isAdmin, async (req, res) => {
    try {
        res.locals.admin = req.session.admin;
        // Получение сообщения из сессии
        const successMessage = req.session.successMessage;
        // Очистка сообщения в сессии после его использования
        delete req.session.successMessage;

        // Получаем информацию о пользователе по userId
        const adminId = req.params.adminId;
        const admin = await db.query('SELECT * FROM admins WHERE id = ?', [adminId]);

        if (!admin || admin.length === 0) {
            return res.status(404).send('Admin not found');
        }

        // Получаем все сообщения для данного пользователя из БД
        const messages = await db.query('SELECT * FROM messages1 WHERE admin_id = ?', [adminId]);

        res.render('messages/adminMessages', {
            admin: admin[0], // Передаем информацию о пользователе на страницу
            messages: messages, // Передаем все сообщения на страницу
            title: 'Admin Messages',
            successMessage
        });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('Internal Server Error');
    }
});


// Маршрут для отображения страницы отправки сообщения админу
router.get('/users/admin/send-message/:adminId', isUser, async (req, res) => {
    try {
        res.locals.user = req.session.user;
        res.locals.admin = req.session.admin;

        // Получаем информацию о пользователе по userId
        const adminId = req.params.adminId;
        const admin = await db.query('SELECT * FROM admins WHERE id = ?', [adminId]);
        
        if (!admin || admin.length === 0) {
            return res.status(404).send('User not found');
        }

        res.render('messages/userToAdmin', {
            admin: admin[0],
            title: 'Send Message to Admin'
        });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Маршрут для обработки POST-запроса на добавление сообщения в БД
router.post('/users/admin/send-message/:adminId', isUser, async (req, res) => {
    try {
        const adminId = req.params.adminId; 
        const messageText = req.body.messageText;
        const userId = req.session.user.id;

        // Проверка наличия текста сообщения
        if (!messageText) {
            return res.status(400).send('Message text is required');
        }

        // Добавление сообщения в БД
        await db.query('INSERT INTO messages1 (user_id, admin_id, message_text) VALUES (?, ?, ?)',
            [userId, adminId, messageText]);
            const successMessage = 'Message delivered success!';
            req.session.successMessage = successMessage;
        res.redirect(`/users/messages/${userId}`);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send(`Internal Server Error: ${err.message}`);
    }
});

router.post('/user/admin/delete-message/:messageId', async (req, res) => {
    const messageId = req.params.messageId;
    const adminId = req.session.admin.id;
    try {
        // Удаление сообщения из таблицы messages1 по messageId
        await db.query('DELETE FROM messages1 WHERE id = ?', [messageId]);
        res.redirect(`/admins/messages/${adminId}`);
    } catch (error) {
        console.error('Error deleting message from table1:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/admin/user/delete-message/:messageId', isUser, async (req, res) => {
    const messageId = req.params.messageId;
    const userId = req.session.user.id;
    try {
        // Удаление сообщения из таблицы messages2 по messageId
        await db.query('DELETE FROM messages2 WHERE id = ?', [messageId]);
        res.redirect(`/users/messages/${userId}`);
    } catch (error) {
        console.error('Error deleting message from table2:', error);
        res.status(500).send('Internal Server Error');
    }
});


module.exports = router;