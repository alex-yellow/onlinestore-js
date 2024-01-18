const express = require('express');
const router = express.Router();
const db = require('../db');

// Рендеринг главной страницы с поддержкой фильтрации и поиска
router.get('/', async (req, res) => {
    try {
        res.locals.user = req.session.user;
        res.locals.admin = req.session.admin;

        // Извлекаем параметры запроса из URL
        const { category_id, search } = req.query;

        // Строим SQL-запрос с учетом параметров фильтрации и поиска
        let sqlQuery = `
            SELECT *
            FROM products
            WHERE 1=1
        `;

        // Добавляем условия фильтрации в SQL-запрос
        if (category_id) {
            sqlQuery += ` AND category_id = '${category_id}'`;
        }

        if (search) {
            sqlQuery += ` AND name LIKE '%${search}%'`;
        }

        // Выполняем SQL-запрос
        const results = await db.query(sqlQuery);

        // Получаем уникальные категории для формирования выпадающего списка
        const categories = await db.query('SELECT * FROM categories');
        // Отправляем результаты на клиент для отображения
        res.render('index', {
            products: results,
            categories: categories,
            selectedCategory: category_id,
            searchQuery: search,
            title: 'Products'
        });
    } catch (err) {
        // Обработка ошибок
        console.error('Ошибка при получении списка продуктов:', err);
        res.status(500).send('Ошибка сервера');
    }
});

// Пример маршрута для просмотра товара
router.get('/products/:id', async (req, res) => {
    try {
        res.locals.user = req.session.user;
        res.locals.admin = req.session.admin;
        const productId = req.params.id;
        // Асинхронный запрос к базе данных для получения информации о товаре по id
        const result = await db.query('SELECT * FROM products WHERE id = ?', [productId]);

        // Проверка наличия товара
        if (result.length === 0) {
            // Если товар не найден, редирект на страницу с товарами или другое действие
            res.redirect('/');
        } else {
            // Рендеринг страницы просмотра товара с полученными данными
            res.render('product', { product: result[0], title: `${result[0].name}` });
        }
    } catch (err) {
        // Обработка ошибок
        console.error('Ошибка при получении информации о товаре:', err);
        res.status(500).send('Ошибка сервера');
    }
});

module.exports = router;