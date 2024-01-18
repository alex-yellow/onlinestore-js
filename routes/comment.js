const express = require('express');
const router = express.Router();
const db = require('../db');
const isUser = require('../middleware/isUser');
const { isAdmin } = require('../middleware/isAdmin');


router.get('/products/:productId/comments', async (req, res) => {
    try {
        res.locals.user = req.session.user;
        res.locals.admin = req.session.admin;
        const productId = req.params.productId;
        // Асинхронный запрос к базе данных для получения информации о комментариях к товару по id
        const result = await db.query(`
            SELECT comments.*, users.name
            FROM comments
            JOIN users ON comments.user_id = users.id
            WHERE comments.product_id = ?
        `, [productId]);

            res.render('comments/index', { comments: result, title: 'Comments', productId });
    } catch (err) {
        // Обработка ошибок
        console.error('Ошибка при получении информации о комментариях:', err);
        res.status(500).send('Ошибка сервера');
    }
});

// Страница добавления комментария
router.get('/products/:productId/add-comment', isUser, async (req, res) => {
    try {
        res.locals.user = req.session.user;
        const productId = req.params.productId;
        // Рендеринг страницы добавления комментария
        res.render('comments/create', {productId, title: 'Add Comment'});
    } catch (err) {
        console.error('Ошибка при открытии страницы добавления комментария:', err);
        res.status(500).send('Ошибка сервера');
    }
});

// Обработка добавления комментария в базу данных
router.post('/products/:productId/add-comment', isUser, async (req, res) => {
    const productId = req.params.productId;
    const text = req.body.text;
    const userId = req.session.user.id; // Извлекаем user_id из сессии, предполагая, что пользователь авторизован
    try {
        // Вставка нового комментария в базу данных
        await db.query('INSERT INTO comments (product_id, user_id, text) VALUES (?, ?, ?)', [productId, userId, text]);

        // Перенаправление на страницу продукта с добавленным комментарием
        res.redirect(`/products/${productId}/comments`);
    } catch (err) {
        console.error('Ошибка при добавлении комментария в базу данных:', err);
        res.status(500).send('Ошибка сервера');
    }
});

// Маршрут для удаления комментария
router.post('/comments/:commentId/delete', isAdmin, async (req, res) => {
    try {
        const commentId = req.params.commentId;
        const result = await db.query('SELECT * FROM comments WHERE id = ?', [commentId]);
        const productId = result[0].product_id;
        // Удаление комментария из базы данных
        await db.query('DELETE FROM comments WHERE id = ?', [commentId]);

        res.redirect(`/products/${productId}/comments`); 
    } catch (err) {
        console.error('Ошибка при удалении комментария:', err);
        res.status(500).send('Ошибка сервера');
    }
});


module.exports = router;