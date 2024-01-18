const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const { isAdmin } = require('../middleware/isAdmin');


// Рендеринг главной страницы продуктов
router.get('/admin/products', isAdmin, async (req, res) => {
    try {
        res.locals.admin = req.session.admin;

        // Получение сообщения из сессии
        const successMessage = req.session.successMessage;
        // Очистка сообщения в сессии после его использования
        delete req.session.successMessage;

        // Асинхронный запрос к базе данных для получения списка продуктов
        const results = await db.query('SELECT * FROM products');
        res.render('admin/index', { products: results, successMessage, title: 'Products' });
    } catch (err) {
        // Обработка ошибок
        console.error('Ошибка при получении списка продуктов:', err);
        res.status(500).send('Ошибка сервера');
    }
});

// Рендеринг страницы входа админа
router.get('/admin', async (req, res) => {
    try {
        const successReg = req.session.successreg;
        delete req.session.successreg;
        res.render('admin/login', { successReg, title: 'Login' });
    } catch (error) {
        console.error('Ошибка при рендеринге страницы входа:', error);
        res.status(500).send('Ошибка сервера');
    }
});

// Обработка данных входа
router.post('/admin', async (req, res) => {
    try {
        const { name, password } = req.body;
        // Валидация данных
        if (!name || !password) {
            return res.render('admin/login', { error: 'Please provide both name and password' });
        }

        // Поиск пользователя по имени
        const admins = await db.query('SELECT * FROM admins WHERE name = ?', [name]);

        const admin = admins[0];

        // Проверка пароля
        if (admin) {
            const passwordMatch = await bcrypt.compare(password, admin.password);

            if (passwordMatch) {
                // Аутентификация успешна
                req.session.admin = admin;
                res.redirect('/admin/products');
            } else {
                res.render('admin/login', { error: 'Invalid name or password' });
            }
        } else {
            res.render('admin/login', { error: 'Invalid name or password' });
        }
    } catch (error) {
        console.error('Ошибка при обработке данных входа:', error);
        res.render('admin/login', { error: 'Unexpected error' });
    }
});

// Выход
router.get('/admin/logout', isAdmin, async (req, res) => {
    try {
        req.session.destroy();
        res.redirect('/login');
    } catch (error) {
        console.error('Ошибка при выходе:', error);
        res.status(500).send('Ошибка сервера');
    }
});

// Рендеринг страницы добавления товара
router.get('/admin/products/create', isAdmin, async function (req, res) {
    try {
        const categories = await db.query('SELECT * FROM categories');
        res.render('admin/create', { title: 'Add product', categories });
    } catch (error) {
        res.render('error', { error: 'Page not found' });
    }
});

// Логика добавления товара
router.post('/admin/products/create', isAdmin, async function (req, res) {
    try {
        const { name, description, price, stock, image, category_id } = req.body;
        await db.query('INSERT INTO products (name, description, price, stock, image, category_id) VALUES (?, ?, ?, ?, ?, ?)', [name, description, price, stock, image, category_id]);
        const successMessage = 'Product added success!';
        req.session.successMessage = successMessage;
        res.redirect('/admin/products');
    } catch (error) {
        console.error('Error adding product:', error);
        res.redirect('/admin/products/create');
    }
});

// Маршрут для редактирования товара
router.get('/admin/products/edit/:id', isAdmin, async (req, res) => {
    const productId = req.params.id;

    try {
        const categories = await db.query('SELECT * FROM categories');
        // Асинхронный запрос к базе данных для получения информации о товаре по его ID
        const result = await db.query('SELECT * FROM products WHERE id = ?', [productId]);

        // Рендеринг страницы редактирования товара с данными о товаре
        res.render('admin/edit', { product: result[0], title: `Edit ${result[0].name}`, categories });
    } catch (err) {
        // Обработка ошибок
        console.error('Ошибка при получении информации о товаре:', err);
        res.status(500).send('Ошибка сервера');
    }
});

// Маршрут для обновления товара
router.post('/admin/products/update/:id', isAdmin, async (req, res) => {
    const productId = req.params.id;

    try {
        const { name, description, price, stock, image } = req.body;

        // Асинхронный запрос к базе данных для обновления информации о товаре
        await db.query('UPDATE products SET name = ?, description = ?, price = ?, stock = ?, image = ? WHERE id = ?', [name, description, price, stock, image, productId]);
        const successMessage = 'Product edit success!';
        req.session.successMessage = successMessage;
        // После успешного обновления, перенаправляем на страницу товаров
        res.redirect('/admin/products');
    } catch (error) {
        // Обработка ошибок
        console.error('Ошибка при обновлении товара:', error);
        res.status(500).send('Ошибка сервера');
    }
});


// Маршрут для удаления товара
router.post('/admin/products/delete/:id', isAdmin, async (req, res) => {
    const productId = req.params.id;

    try {
        // Асинхронный запрос к базе данных для удаления товара
        await db.query('DELETE FROM products WHERE id = ?', [productId]);
        const successMessage = 'Product delete success!';
        req.session.successMessage = successMessage;
        // После успешного удаления, перенаправляем на страницу товаров
        res.redirect('/admin/products');
    } catch (error) {
        // Обработка ошибок
        console.error('Ошибка при удалении товара:', error);
        res.status(500).send('Ошибка сервера');
    }
});

// Рендеринг главной страницы заказов
router.get('/admin/orders', isAdmin, async (req, res) => {
    try {
        // Получение сообщения из сессии
        const successMessage = req.session.successMessage;
        // Очистка сообщения в сессии после его использования
        delete req.session.successMessage;
        // SQL-запрос с использованием JOIN для получения данных о заказах, продуктах и пользователях
        const results = await db.query(`
            SELECT orders.id, orders.date, products.name AS product_name, users.name AS user_name, orders.quantity, orders.status
            FROM orders
            JOIN products ON orders.product_id = products.id
            JOIN users ON orders.user_id = users.id
            ORDER BY orders.id;
        `);

        // Рендеринг страницы с данными о заказах
        res.render('admin/orders', { orders: results, successMessage, title: 'Orders' });
    } catch (err) {
        // Обработка ошибок
        console.error('Ошибка при получении данных о заказах:', err);
        res.status(500).send('Ошибка сервера');
    }
});

// Маршрут для удаления заказа
router.post('/admin/orders/delete/:id', isAdmin, async (req, res) => {
    const productId = req.params.id;

    try {
        // Асинхронный запрос к базе данных для удаления товара
        await db.query('DELETE FROM orders WHERE id = ?', [productId]);
        const successMessage = 'Order delete success!';
        req.session.successMessage = successMessage;
        // После успешного удаления, перенаправляем на страницу товаров
        res.redirect('/admin/orders');
    } catch (error) {
        // Обработка ошибок
        console.error('Ошибка при удалении заказа:', error);
        res.status(500).send('Ошибка сервера');
    }
});

// Рендеринг главной страницы списка пользователей
router.get('/admin/users', isAdmin, async (req, res) => {
    try {
        res.locals.admin = req.session.admin;

        // Получение сообщения из сессии
        const successMessage = req.session.successMessage;
        // Очистка сообщения в сессии после его использования
        delete req.session.successMessage;

        // Асинхронный запрос к базе данных для получения списка продуктов
        const results = await db.query('SELECT * FROM users');
        res.render('admin/users', { users: results, successMessage, title: 'Users' });
    } catch (err) {
        // Обработка ошибок
        console.error('Ошибка при получении списка пользователей:', err);
        res.status(500).send('Ошибка сервера');
    }
});

// Маршрут для удаления пользователя
router.post('/admin/users/delete/:id', isAdmin, async (req, res) => {
    const userId = req.params.id;
    try {
        // Удаление связанных заказов
        await db.query('DELETE FROM orders WHERE user_id = ?', [userId]);

        // Удаление связанных сообщений
        await db.query('DELETE FROM messages1 WHERE user_id = ? OR admin_id = ?', [userId, userId]);
        await db.query('DELETE FROM messages2 WHERE user_id = ? OR admin_id = ?', [userId, userId]);

        // Удаление связанных комментариев
        await db.query('DELETE FROM comments WHERE user_id = ?', [userId]);

        // Удаление пользователя
        await db.query('DELETE FROM users WHERE id = ?', [userId]);

        const successMessage = 'User delete success!';
        req.session.successMessage = successMessage;

        // После успешного удаления, перенаправляем на страницу пользователей
        res.redirect('/admin/users');
    } catch (error) {
        // Обработка ошибок
        console.error('Ошибка при удалении пользователя:', error);
        res.status(500).send('Ошибка сервера');
    }
});

module.exports = router;