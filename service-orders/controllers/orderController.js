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
    res.json({
        success: true,
        data: orders
    });
};
//получение по айди
exports.getOrderById = (req, res) => {
    const currentUser = getUserFromToken(req);
    const orders = readJSON(ordersData);
    const orderId = req.params.orderId;
    const order = orders.find(o => o.id===orderId);

    const isManager = currentUser.roles.includes(1); 
    const isEngineer = currentUser.roles.includes(2); 

    if (!order) return res.status(404).json({
        success: false,
        error: {code: 404, message: 'Заказ не найден'}
    });

    if (!isManager&&!isEngineer&&currentUser.id!==order.userId){
          return res.status(403).json({ 
            success: false, 
            error: {code: 403, message: 'Доступ запрещён'}
        });
    }
    
    res.json({
        success: true,
        data: order
    });
};
//добавить
exports.createOrder = async (req, res) => {
    const parseResult = orderValidation.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        code: 400,
        message: parseResult.error.issues
      });
    }
    const authHeader = req.headers.authorization;
    const currentUser = getUserFromToken(req);
    const orders = readJSON(ordersData);
    const {userId, order, total} = parseResult.data;

    if (!userId||!order||!total){
      return res.status(400).json({ 
        success: false, 
        error: {code: 400, message: 'Не все поля заполнены'} });
    }

    try {
        const response = await axios.get(`${USERS_SERVICE_URL}/users/${userId}`, {
            headers: {authorization: authHeader}
        });
        if (!response.data.success) {
            return res.status(404).json({
            success: false,
            error: { code: 404, message: 'Пользователь не найден' }
            });
        }
        } catch (err) {
            return res.status(500).json({
                success: false,
                error: { code: 500, message: 'Пользователь не найден или сервис недоступен' }
            });
    }

    const isManager = currentUser.roles.includes(1); 
    if (!isManager&&currentUser.id!==userId){
        return res.status(403).json({ 
            success: false, 
            error: {code: 403, message: 'Доступ запрещён'} });
    }


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
    const parseResult = orderValidation.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        code: 400,
        message: parseResult.error.issues
      });
    }
    const currentUser = getUserFromToken(req);
    const orders = readJSON(ordersData);
    const orderId = req.params.orderId;
    const {order, total, status} = parseResult.data;
    const updates = {};

    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return res.status(404).json({ 
        success: false, 
        error: { code: 404, message: 'Заказ не найден' } });

    const isManager = currentUser.roles.includes(1);
    const isEngineer = currentUser.roles.includes(2);
    const isClient = !isManager&&!isEngineer; 
    if (isClient && currentUser.id !== orders[orderIndex].userId) {
      return res.status(403).json({ 
        success: false, 
        error: {code:403, message: 'Нет прав на редактирование этого заказа'} });
    }

    if (order) {
        if (!isManager) updates.order = order;
        else return res.status(403).json({ 
            success: false, 
            error: {code:403, message: 'Нет прав на редактирование этого заказа'} });
    }
    if (total) {
        if (isManager) updates.total = total;
        else return res.status(403).json({ 
            success: false, 
            error: {code:403, message: 'Нет прав на редактирование этого заказа'} });
    }
    if (status) {
        if (isClient){
            const current = orders[orderIndex].status;
            const allowed = (current === "Создан" && status === "Отменен");
            if (!allowed) {
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
                return res.status(403).json({ 
                    success: false, 
                    error: {code:403, message: 'Нет прав на редактирование этого заказа'} });
            }
        }
        updates.status = status;
    }

    const updateOrder = {
    ...orders[orderIndex],
    ...updates,
    date_of_update: new Date().toISOString()
     }; 

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
    const orders = readJSON(ordersData);
    const orderId = req.params.orderId;

    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return res.status(404).json({ 
        success: false, 
        error: { code: 404, message: 'Заказ не найден' } });

    const deletedOrder = orders.splice(orderIndex, 1)[0];
    writeJSON(ordersData, orders);

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