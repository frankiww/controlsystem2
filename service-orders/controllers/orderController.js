const fs = require('fs');
const path = require('path');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const dataPath = path.join(process.cwd(),'data');
const ordersData = path.join(dataPath, 'orders.json');
const { JWT_SECRET } = require('../config/jwt');
const { USERS_SERVICE_URL } = require('../config/services');
const { publishEvent } = require('../events/publisher');
const { orderValidation } = require('../validation/orderValidation');



function readJSON(file) {
    if (!fs.existsSync(file)) return [];
    const data = fs.readFileSync(file, 'utf-8');
    return JSON.parse(data);
}

function writeJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

function getUserFromToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
//получение всех
exports.getAllOrders = (req, res) => {
    req.log.info({filters: req.query},'Начало получения заказов');
    let orders = readJSON(ordersData);
    const userId = req.query.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const statusFilter = req.query.status;
    if (userId) {
        orders = orders.filter(o => o.userId===userId);
    }
    if (statusFilter) {
        orders = orders.filter(o => o.status===statusFilter);
    }
    if (page&&limit) {
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      orders = orders.slice(startIndex, endIndex);
    }
    req.log.info({ordersCount: orders.length},'Заказы успешно получены');
    res.json({
        success: true,
        data: orders
    });
};
//получение по айди
exports.getOrderById = (req, res) => {
    req.log.info({orderId: req.params.orderId},'Начало получения заказа по айди');
    const currentUser = getUserFromToken(req);
    const orders = readJSON(ordersData);
    const orderId = req.params.orderId;
    const order = orders.find(o => o.id===orderId);

    const isManager = currentUser.roles.includes(1); 
    const isEngineer = currentUser.roles.includes(2); 

    if (!order) {
        req.log.warn('Заказ не найден');
        return res.status(404).json({
        success: false,
        error: {code: 404, message: 'Заказ не найден'}
        });
    }
    req.log.info('Начало проверки доступа');
    if (!isManager&&!isEngineer&&currentUser.id!==order.userId){
        req.log.warn('Доступ запрещен');
          return res.status(403).json({ 
            success: false, 
            error: {code: 403, message: 'Доступ запрещён'}
        });
    }
    req.log.info('Проверка доступа прошла успешно');
    req.log.info({orderId: order.id},'Получение заказа прошло успешно');
    res.json({
        success: true,
        data: order
    });
};
//добавить
exports.createOrder = async (req, res) => {
    req.log.info('Начало создания заказа');
    req.log.info('Начало валидации данных');
    const parseResult = orderValidation.safeParse(req.body);
    if (!parseResult.success) {
      req.log.warn({error: parseResult.error.issues},'Валидация данных не пройдена');
      return res.status(400).json({
        code: 400,
        message: parseResult.error.issues
      });
    }
    req.log.info('Валидация данных прошла успешно');
    req.log.info('Начало получения пользователя');
    const authHeader = req.headers.authorization;
    const currentUser = getUserFromToken(req);
    const orders = readJSON(ordersData);
    const {userId, order, total} = parseResult.data;

    try {
        const response = await axios.get(`${USERS_SERVICE_URL}/users/${userId}`, {
            headers: {authorization: authHeader, 'x-request-id' : req.requestId}
        });
        } catch (err) {
            if (err.response){
                req.log.warn("Не удалось получить пользователя");
                return res.status(err.response.status).json(err.response.data);
            }
            req.log.error('Ошибка при запросе к сервису пользователей');
            return res.status(500).json({
                success: false,
                error: { code: 500, message: 'Пользователь не найден или сервис недоступен' }
            });
    }
    req.log.info('Пользователь успешно получен');
    
    req.log.info('Начало проверки доступа');
    const isManager = currentUser.roles.includes(1); 
    if (!isManager&&currentUser.id!==userId){
        req.log.warn('Доступ запрещен');
        return res.status(403).json({ 
            success: false, 
            error: {code: 403, message: 'Доступ запрещён'} });
    }
    req.log.info('Проверка доступа прошла успешно');

    const { v4: uuid } = await import('uuid');
    const newOrder = {
        id: uuid(),
        userId,
        order,
        status: "Создан",
        total,
        date_of_creation: new Date().toISOString(),
        date_of_update: new Date().toISOString()
    };
    req.log.info('Заказ успешно создан');

    orders.push(newOrder);
    writeJSON(ordersData, orders);

    publishEvent('order.created', {
        orderId: newOrder.id,
        userId: newOrder.userId,
        status: newOrder.status
    });

    return res.status(201).json({
        success: true, data: newOrder});
};
//обновить
exports.updateOrder = async (req, res) => {
    req.log.info({orderId: req.params.orderId},'Начало обновления заказа');
    req.log.info('Начало валидации данных');
    const parseResult = orderValidation.safeParse(req.body);
    if (!parseResult.success) {
      req.log.warn({error: parseResult.error.issues},'Валидация данных не пройдена');
      return res.status(400).json({
        code: 400,
        message: parseResult.error.issues
      });
    }
    req.log.info('Валидация данных прошла успешно');
    req.log.info('Начало получения заказа');
    const currentUser = getUserFromToken(req);
    const orders = readJSON(ordersData);
    const orderId = req.params.orderId;
    const {order, total, status} = parseResult.data;
    const updates = {};

    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) {
        req.log.warn('Заказ не найден');
        return res.status(404).json({ 
        success: false, 
        error: { code: 404, message: 'Заказ не найден' } });
    }
    req.log.info('Получение заказа прошло успешно');

    req.log.info('Начало проверки доступа');
    const isManager = currentUser.roles.includes(1);
    const isEngineer = currentUser.roles.includes(2);
    const isClient = !isManager&&!isEngineer; 
    if (isClient && currentUser.id !== orders[orderIndex].userId) {
      req.log.warn('Доступ запрещен');
      return res.status(403).json({ 
        success: false, 
        error: {code:403, message: 'Нет прав на редактирование этого заказа'} });
    }

    if (order) {
        if (!isManager) updates.order = order;
        else {
            req.log.warn('Доступ запрещен');
            return res.status(403).json({ 
                success: false, 
                error: {code:403, message: 'Нет прав на редактирование этого заказа'} });
        }
    }
    if (total) {
        if (isManager) updates.total = total;
        else {
            req.log.warn('Доступ запрещен');
            return res.status(403).json({ 
                success: false, 
                error: {code:403, message: 'Нет прав на редактирование этого заказа'} });
        }
    }
    if (status) {
        if (isClient){
            const current = orders[orderIndex].status;
            const allowed = (current === "Создан" && status === "Отменен");
            if (!allowed) {
                req.log.warn('Доступ запрещен');
                return res.status(403).json({ 
                    success: false, 
                    error: {code:403, message: 'Нет прав на редактирование этого заказа'} });
            }
        }
        if (isEngineer) {
            const current = orders[orderIndex].status;
            const allowed =
                (current === "Создан" && status === "В работе") ||
                (current === "В работе" && ["Выполнен", "Отменен"].includes(status));

            if (!allowed) {
                req.log.warn('Доступ запрещен');
                return res.status(403).json({ 
                    success: false, 
                    error: {code:403, message: 'Нет прав на редактирование этого заказа'} });
            }
        }
        updates.status = status;
    }
    req.log.info('Проверка доступа прошла успешно');

    const updateOrder = {
    ...orders[orderIndex],
    ...updates,
    date_of_update: new Date().toISOString()
     }; 
    req.log.info({orderId: updateOrder.id},'Обновление заказа прошло успешно');
    orders[orderIndex] = updateOrder;
    writeJSON(ordersData, orders);

    publishEvent('order.updated', {
        orderId: updateOrder.id,
        userId: updateOrder.userId,
        newStatus: updateOrder.status
    });

    return res.status(200).json({success: true, data: updateOrder});
};
//удалить
exports.deleteOrder = (req, res) => {
    req.log.info({orderId: req.params.orderId},'Начало удаления заказа');
    const orders = readJSON(ordersData);
    const orderId = req.params.orderId;
    req.log.info('Начало получения заказа');
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) {
        req.log.warn('Заказ не найден');
        return res.status(404).json({ 
        success: false, 
        error: { code: 404, message: 'Заказ не найден' } });
    }
    req.log.info('Получение заказа прошло успешно');

    const deletedOrder = orders.splice(orderIndex, 1)[0];
    writeJSON(ordersData, orders);
    req.log.info({orderId: req.params.orderId},'Удаление заказа прошло успешно');

    res.json({ 
        success: true,
        data: {message: 'Заказ удален', deletedOrder }
        });
};
//другое
exports.healthCheck = (req, res) => {
  res.json({
    status: 'OK',
    service: 'Orders Service',
    timestamp: new Date().toISOString()
  });
};

exports.statusCheck = (req, res) => {
  res.json({ status: 'Orders service is running' });
};