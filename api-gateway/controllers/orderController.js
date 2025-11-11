const { ORDERS_SERVICE_URL } = require('../config/services');
const ordersCircuit = require('../circuits/ordersCircuit');

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await ordersCircuit.fire(`${ORDERS_SERVICE_URL}/orders`);
    if (!orders.success){
      res.status(orders.error?.code || 400).json(orders)
    }
    res.json(orders);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const token = req.headers.authorization;
    const order = await ordersCircuit.fire(`${ORDERS_SERVICE_URL}/orders/${req.params.orderId}`, {
      headers: {authorization: token}
    });
    if (!order.success){
      res.status(order.error?.code || 400).json(order)
    }
    res.json(order);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};


exports.createOrder = async (req, res) => {
  try {
    const order = await ordersCircuit.fire(`${ORDERS_SERVICE_URL}/orders`, {
      method: 'POST',
      data: req.body
    });
    res.status(201).json(order);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const order = await ordersCircuit.fire(`${ORDERS_SERVICE_URL}/orders/${req.params.orderId}`, {
      method: 'PUT',
      data: req.body
    });
    res.json(order);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const result = await ordersCircuit.fire(`${ORDERS_SERVICE_URL}/orders/${req.params.orderId}`, {
      method: 'DELETE'
    });
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};
