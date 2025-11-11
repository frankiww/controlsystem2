const fs = require('fs');
const path = require('path');
const axios = require('axios');

const dataPath = path.join(process.cwd(),'data');
const ordersData = path.join(dataPath, 'orders.json');

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

    if (userId) {
        orders = orders.filter(o => o.userId===userId);
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
          return res.status(403).json({ success: false, error: 'Доступ запрещён' });
    }
    
    res.json({
        success: true,
        data: order
    });
};
//добавить
exports.createOrder = async (req, res) => {
    const orders = readJSON(ordersData);
    const {userId, order, total} = req.body;

    try {
        const response = await axios.get(`http://localhost:8000/api/users/${userId}`);
        if (!response.data.success) {
            return res.status(400).json({
            success: false,
            error: { code: 400, message: 'Пользователь не найден' }
            });
        }
        } catch (err) {
            return res.status(400).json({
                success: false,
                error: { code: 400, message: 'Пользователь не найден или сервис недоступен' }
            });
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

    res.status(201).json({
        success: true, data: newOrder});
};
//обновить
exports.updateOrder = async (req, res) => {
    const orders = readJSON(ordersData);
    const orderId = req.params.orderId;
    const updates = req.body;

    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return res.status(404).json({ 
        success: false, 
        error: { code: 404, message: 'Заказ не найден' } });

    const updateOrder = {
    ...orders[orderIndex],
    ...updates,
    date_of_update: new Date().toISOString()
     }; 

    orders[orderIndex] = updateOrder;
    writeJSON(ordersData, orders);

    res.status(200).json({success: true, data: updateOrder});
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