const { ORDERS_SERVICE_URL } = require('../config/services');
const ordersCircuit = require('../circuits/ordersCircuit');

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await ordersCircuit.fire(`${ORDERS_SERVICE_URL}/orders`);
    res.json(orders);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const order = await ordersCircuit.fire(`${ORDERS_SERVICE_URL}/orders/${req.params.orderId}`);
    if (order.error === 'Otder not found') return res.status(404).json(order);
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
