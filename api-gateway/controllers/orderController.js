const { ORDERS_SERVICE_URL } = require('../config/services');
const ordersCircuit = require('../circuits/ordersCircuit');

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await ordersCircuit.fire(`${ORDERS_SERVICE_URL}/orders`);
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
    const token = req.headers.authorization;
    const order = await ordersCircuit.fire(`${ORDERS_SERVICE_URL}/orders/${req.params.orderId}`, {
      headers: {authorization: token}
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
    const token = req.headers.authorization;
    const order = await ordersCircuit.fire(`${ORDERS_SERVICE_URL}/orders`, {
      method: 'POST',
      headers: {authorization: token},
      data: req.body
    });
    if (!order.success){
      return res.status(order.error?.code || 400).json(order)
    }
    return res.status(201).json(order);
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const token = req.headers.authorization;
    const order = await ordersCircuit.fire(`${ORDERS_SERVICE_URL}/orders/${req.params.orderId}`, {
      method: 'PUT',
      headers: {authorization: token},
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
    const result = await ordersCircuit.fire(`${ORDERS_SERVICE_URL}/orders/${req.params.orderId}`, {
      method: 'DELETE'
    });
    if (!order.success){
      return res.status(order.error?.code || 400).json(order)
    }
    return res.json(result);
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
};
