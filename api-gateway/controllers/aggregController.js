const usersCircuit = require('../circuits/usersCircuit');
const ordersCircuit = require('../circuits/ordersCircuit');
const { USERS_SERVICE_URL, ORDERS_SERVICE_URL } = require('../config/services');

exports.getUserWithOrders = async (req, res) => {
  try {
    const userId = req.params.userId;

    const userPromise = usersCircuit.fire(`${USERS_SERVICE_URL}/users/${userId}`);
    const ordersPromise = ordersCircuit
      .fire(`${ORDERS_SERVICE_URL}/orders`)
      .then(response => {
        const orders = response.data || [];
        return orders.filter(order => order.userId == userId);
      });

    const [userResponse, userOrders] = await Promise.all([userPromise, ordersPromise]);

    if (!userResponse || userResponse.success === false || userResponse.error === 'Пользователь не найден') {
      return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    }

    const user = userResponse.data || userResponse;

    return res.json({
      success: true,
      data: {
        user,
        orders: userOrders
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
