const { ORDERS_SERVICE_URL } = require('../config/services');
const ordersCircuit = require('../circuits/ordersCircuit');

exports.getAllOrders = async (req, res) => {
  try {
    const requestId = req.requestId;
    const queryString = new URLSearchParams(req.query).toString();
    req.log.info({queryString}, 'Начало получения заказов');
    const orders = await ordersCircuit.fire(`${ORDERS_SERVICE_URL}/orders${queryString ? '?' + queryString : ''}`, {
      headers: {'x-request-id' : requestId}
    });
    if (!orders.success){
      req.log.warn({error: orders.error}, 'Не удалось получить заказы');
      return res.status(orders.error?.code || 400).json(orders)
    }
    req.log.info({ordersCount: orders.data.length}, 'Заказы успешно получены');
    return res.json(orders);
  } catch {
    req.log.error('Не удалось получить заказы');
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const requestId = req.requestId;
    const token = req.headers.authorization;
    req.log.info({orderId: req.params.orderId}, 'Начало получения заказа');
    const order = await ordersCircuit.fire(`${ORDERS_SERVICE_URL}/orders/${req.params.orderId}`, {
      headers: {authorization: token, 'x-request-id' : requestId}
    });
    if (!order.success){
      req.log.warn({error: order.error}, 'Не удалось получить заказ');
      return res.status(order.error?.code || 400).json(order)
    }
    req.log.info({orderId: order.data.id}, 'Заказ успешно получен');
    return res.json(order);
  } catch {
    req.log.error('Ошибка при получении заказа');
    return res.status(500).json({ error: 'Internal server error' });
  }
};


exports.createOrder = async (req, res) => {
  try {
    const requestId = req.requestId;
    const token = req.headers.authorization;
    const { userId, order, total} = req.body;
    req.log.info('Начало проверки полей');
    if (!userId||!order||!total){
      req.log.warn('Не все поля заполнены');
      return res.status(400).json({ 
        success: false, 
        error: {code: 400, message: 'Не все поля заполнены'} });
    }
    req.log.info('Проверка полей прошла успешно');
    req.log.info('Начало создания заказа');
    const orderRes = await ordersCircuit.fire(`${ORDERS_SERVICE_URL}/orders`, {
      method: 'POST',
      headers: {authorization: token, 'x-request-id' : requestId},
      data: req.body
    });
    if (!orderRes.success){
      req.log.warn({error: orderRes.error},'Не удалось создать заказ');
      return res.status(orderRes.error?.code || 400).json(orderRes)
    }
    req.log.info({orderId: orderRes.data.id}, 'Заказ успешно создан');
    return res.status(201).json(orderRes);
  } catch {
    req.log.error('Ошибка при создании заказа');
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const requestId = req.requestId;
    const token = req.headers.authorization;
    req.log.info({orderId: req.params.orderId},'Начало обновления заказа');
    const order = await ordersCircuit.fire(`${ORDERS_SERVICE_URL}/orders/${req.params.orderId}`, {
      method: 'PUT',
      headers: {authorization: token, 'x-request-id' : requestId},
      data: req.body
    });
    if (!order.success){
      req.log.warn({error: order.error},'Не удалось обновить заказ');
      return res.status(order.error?.code || 400).json(order)
    }
    req.log.info({orderId: order.data.id},'Заказ успешно обновлен');
    return res.json(order);
  } catch {
    req.log.error('Ошибка при обновлении заказа');
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const requestId = req.requestId;
    req.log.info({orderId: req.params.orderId},'Начало удаления заказа');
    const result = await ordersCircuit.fire(`${ORDERS_SERVICE_URL}/orders/${req.params.orderId}`, {
      method: 'DELETE',
      headers: {'x-request-id' : requestId}
    });
    if (!order.success){
      req.log.warn({error: order.error},'Не удалось удалить заказ');
      return res.status(order.error?.code || 400).json(order)
    }
    req.log.info({orderId: result.data.id},'Заказ успешно удален');
    return res.json(result);
  } catch {
    req.log.error('Ошибка при удалении заказа');
    return res.status(500).json({ error: 'Internal server error' });
  }
};
