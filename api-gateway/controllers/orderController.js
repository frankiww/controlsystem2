const { ORDERS_SERVICE_URL } = require('../config/services');
const ordersCircuit = require('../circuits/ordersCircuit');

exports.getAllOrders = async (req, res) => {
  try {
    const requestId = req.requestId;
    const queryString = new URLSearchParams(req.query).toString();
    const orders = await ordersCircuit.fire(`${ORDERS_SERVICE_URL}/orders${queryString ? '?' + queryString : ''}`, {
      headers: {'x-request-id' : requestId}
    });
    if (!orders.success){
      return res.status(orders.error?.code || 400).json(orders)
    }
    return res.json(orders);
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const requestId = req.requestId;
    const token = req.headers.authorization;
    const order = await ordersCircuit.fire(`${ORDERS_SERVICE_URL}/orders/${req.params.orderId}`, {
      headers: {authorization: token, 'x-request-id' : requestId}
    });
    if (!order.success){
      return res.status(order.error?.code || 400).json(order)
    }
    return res.json(order);
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
};


exports.createOrder = async (req, res) => {
  try {
    const requestId = req.requestId;
    const token = req.headers.authorization;
    const { userId, order, total} = req.body;
    if (!userId||!order||!total){
      return res.status(400).json({ 
        success: false, 
        error: {code: 400, message: 'Не все поля заполнены'} });
    }
    const orderRes = await ordersCircuit.fire(`${ORDERS_SERVICE_URL}/orders`, {
      method: 'POST',
      headers: {authorization: token, 'x-request-id' : requestId},
      data: req.body
    });
    if (!orderRes.success){
      return res.status(orderRes.error?.code || 400).json(orderRes)
    }
    return res.status(201).json(orderRes);
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const requestId = req.requestId;
    const token = req.headers.authorization;
    const order = await ordersCircuit.fire(`${ORDERS_SERVICE_URL}/orders/${req.params.orderId}`, {
      method: 'PUT',
      headers: {authorization: token, 'x-request-id' : requestId},
      data: req.body
    });
    if (!order.success){
      return res.status(order.error?.code || 400).json(order)
    }
    return res.json(order);
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const requestId = req.requestId;
    const result = await ordersCircuit.fire(`${ORDERS_SERVICE_URL}/orders/${req.params.orderId}`, {
      method: 'DELETE',
      headers: {'x-request-id' : requestId}
    });
    if (!order.success){
      return res.status(order.error?.code || 400).json(order)
    }
    return res.json(result);
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
};
