const usersCircuit = require('../circuits/usersCircuit');
const ordersCircuit = require('../circuits/ordersCircuit');
const { USERS_SERVICE_URL, ORDERS_SERVICE_URL } = require('../config/services');

exports.getUserWithOrders = async (req, res) => {
  try {
    const token = req.headers.authorization;
    const requestId = req.requestId;
    const userId = req.params.userId;
    const params = new URLSearchParams(req.query);

    let user = await usersCircuit.fire(`${USERS_SERVICE_URL}/users/${userId}`, {
      headers: {authorization: token, 'x-request-id' : requestId}
    });
    if (!user.success){
      return res.status(user.error?.code || 400).json(user)
    }

    params.set('userId', userId);
    const queryString = params.toString();
    let orders = await ordersCircuit.fire(`${ORDERS_SERVICE_URL}/orders${queryString ? '?' + queryString : ''}`, {
      headers: {authorization: token, 'x-request-id' : requestId}
    });
    if (!orders.success){
      return res.status(orders.error?.code || 400).json(orders)
    }
    user = user.data;
    orders = orders.data;
    
    return res.json({
      success: true,
      data: {
        user,
        orders
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {code: 500, message: 'Internal server error'}
    });
  }
};
