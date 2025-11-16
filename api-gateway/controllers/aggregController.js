const usersCircuit = require('../circuits/usersCircuit');
const ordersCircuit = require('../circuits/ordersCircuit');
const { USERS_SERVICE_URL, ORDERS_SERVICE_URL } = require('../config/services');

exports.getUserWithOrders = async (req, res) => {
  try {
    const token = req.headers.authorization;
    const requestId = req.requestId;
    const userId = req.params.userId;
    const params = new URLSearchParams(req.query);

    req.log.info({userId, query: req.query}, 'Начало агрегации пользователя с заказами');
    let user = await usersCircuit.fire(`${USERS_SERVICE_URL}/users/${userId}`, {
      headers: {authorization: token, 'x-request-id' : requestId}
    });
    if (!user.success){
      req.log.warn({userId, error: user.error}, 'Не удалось получить пользователя');
      return res.status(user.error?.code || 400).json(user)
    }
    req.log.info({user: user.data.id}, 'Пользователь успешно получен');

    params.set('userId', userId);
    const queryString = params.toString();
    req.log.info({queryString}, 'Получаем заказы пользователя');
    let orders = await ordersCircuit.fire(`${ORDERS_SERVICE_URL}/orders${queryString ? '?' + queryString : ''}`, {
      headers: {authorization: token, 'x-request-id' : requestId}
    });
    if (!orders.success){
      req.log.warn({error: orders.error}, 'Не удалось получить заказы');
      return res.status(orders.error?.code || 400).json(orders)
    }
    req.log.info({ordersCount: orders.data.length}, 'Заказы успешно получены');
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
    req.log.error({error}, 'Ошибка при агрегации пользователя с заказами');
    return res.status(500).json({
      success: false,
      error: {code: 500, message: 'Internal server error'}
    });
  }
};
