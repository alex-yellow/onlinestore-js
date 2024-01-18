const express = require('express');
const router = express.Router();
const db = require('../db');
const isUser = require('../middleware/isUser');

// Маршрут для отображения главной страницы заказов конкретного пользователя
router.get('/orders/:userId', isUser, async (req, res) => {
    const userId = req.params.userId;

    try {
        // SQL-запрос с использованием JOIN для получения данных о заказах и их статусах
        const results = await db.query(`
            SELECT orders.id, orders.date, products.name AS product_name, orders.quantity, orders.status
            FROM orders
            JOIN products ON orders.product_id = products.id
            WHERE orders.user_id = ?;
        `, [userId]);

        res.render('orders/index', { orders: results, title: 'MyOrders' });
    } catch (err) {
        console.error('Ошибка при получении данных о заказах пользователя:', err);
        res.status(500).send('Ошибка сервера');
    }
});

// Маршрут для добавления товара в корзину
router.post('/orders/add-to-cart/:productId', isUser, async (req, res) => {
    const userId = req.session.user.id;
    const productId = req.params.productId;
    const quantity = req.body.quantity;

    try {
        // Проверка, есть ли уже товар в корзине для данного пользователя
        const existingOrder = await db.query('SELECT * FROM orders WHERE user_id = ? AND product_id = ?', [userId, productId]);
        if (existingOrder.length > 0) {
            if (existingOrder[0].status !== 1) {
                // Если товар уже есть в корзине, увеличиваем количество
                await db.query('UPDATE orders SET quantity = quantity + 1 WHERE id = ?', [existingOrder[0].id]);
            }
            else {
                await db.query('INSERT INTO orders (user_id, product_id, quantity, status) VALUES (?, ?, ?, 0)', [userId, productId, quantity]);
            }
        } else {
            // Если товара нет в корзине, создаем новый заказ
            await db.query('INSERT INTO orders (user_id, product_id, quantity, status) VALUES (?, ?, ?, 0)', [userId, productId, quantity]);
        }

        res.redirect(`/orders/${userId}`); // Редирект обратно на главную страницу
    } catch (err) {
        console.error('Ошибка при добавлении товара в корзину:', err);
        res.status(500).send('Ошибка сервера');
    }
});

router.post('/orders/:orderId/updateQuantityPlus', isUser, async (req, res) => {
    const orderId = req.params.orderId;
    const userId = req.session.user.id;

    try {
        // Получение текущего значения quantity
        const currentOrder = await db.query('SELECT * FROM orders WHERE id = ?', [orderId]);

        const currentQuantity = currentOrder[0].quantity;
        const currentStatus = currentOrder[0].status;
        // Проверка, чтобы quantity не стало меньше 1
        if (currentQuantity >= 1 && currentStatus !== 1) {
            // Обновление статуса и количества товара в базе данных
            await db.query('UPDATE orders SET quantity = quantity + 1 WHERE id = ?', [orderId]);
        }

        res.redirect(`/orders/${userId}`);
    } catch (err) {
        console.error('Ошибка при обновлении статуса заказа:', err);
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
});

router.post('/orders/:orderId/updateQuantityMinus', isUser, async (req, res) => {
    const orderId = req.params.orderId;
    const userId = req.session.user.id;

    try {
        // Получение текущего значения quantity
        const currentOrder = await db.query('SELECT * FROM orders WHERE id = ?', [orderId]);

        const currentQuantity = currentOrder[0].quantity;
        const currentStatus = currentOrder[0].status;

        // Проверка, чтобы quantity не стало меньше 1
        if (currentQuantity > 1 && currentStatus !== 1) {
            // Обновление статуса и количества товара в базе данных
            await db.query('UPDATE orders SET quantity = quantity - 1 WHERE id = ?', [orderId]);
        }

        res.redirect(`/orders/${userId}`);
    } catch (err) {
        console.error('Ошибка при обновлении статуса заказа:', err);
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
});

router.post('/orders/:orderId/update/', isUser, async (req, res) => {
    const orderId = req.params.orderId;
    const userId = req.session.user.id;

    try {
        // Получаем текущий заказ
        const order = await db.query('SELECT * FROM orders WHERE id = ?', [orderId]);
        const quantity = order[0].quantity;
        const result = await db.query(`
        SELECT orders.id, orders.date, products.id AS product_id, products.stock
        FROM orders
        JOIN products ON orders.product_id = products.id
        WHERE orders.id = ?;
        `, [orderId]);
        const stock = result[0].stock;
        const productId = result[0].product_id;
        newStock = stock - quantity;
        // Обновляем значение Status в 1
        const newStatus = 1;
        
        //Обновление статуса и количества товара в базе данных
        await db.query('UPDATE orders SET status = ? WHERE id = ?', [newStatus, orderId]);
        if(order[0].status !==1 ){
            await db.query('UPDATE products SET stock = ? WHERE id = ?', [newStock, productId]);
        }

        res.redirect(`/orders/${userId}`);
    } catch (err) {
        console.error('Ошибка при обновлении статуса заказа:', err);
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
});

// Маршрут для удаления заказа
router.post('/orders/delete/:orderId', isUser, async (req, res) => {
    const orderId = req.params.orderId;
    const userId = req.session.user.id; // Предполагая, что вы храните информацию о пользователе в сессии

    try {
        // Удаление заказа из базы данных
        await db.query('DELETE FROM orders WHERE id = ?', [orderId]);

        res.redirect(`/orders/${userId}`);
    } catch (err) {
        console.error('Ошибка при удалении заказа:', err);
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
});

module.exports = router;