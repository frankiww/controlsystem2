const usersCircuit = require('../circuits/usersCircuit');
const ordersCircuit = require('../circuits/ordersCircuit');
const { USERS_SERVICE_URL, ORDERS_SERVICE_URL } = require('../config/services');

exports.getUserWithOrders = async (req, res) => {
  try {
    const token = req.headers.authorization;
    const userId = req.params.userId;

    const userPromise = usersCircuit.fire(`${USERS_SERVICE_URL}/users/${userId}`,
      {
        headers: {authorization: token}
      }
    );
    const ordersPromise = ordersCircuit
      .fire(`${ORDERS_SERVICE_URL}/orders`, 
        {
          headers: {authorization: token}
        }
      )
      .then(response => {
        const orders = response.data || [];
        return orders.filter(order => order.userId == userId);
      });

    const [userResponse, userOrders] = await Promise.all([userPromise, ordersPromise]);

    if (!userResponse || !userResponse.success) {
      return res.status(userResponse.error?.code || 400).json(userResponse)
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
