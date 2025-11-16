const { USERS_SERVICE_URL } = require('../config/services');
const usersCircuit = require('../circuits/usersCircuit');
const bcrypt = require('bcryptjs');

exports.getAllUsers = async (req, res) => {
  try {
    const requestId = req.requestId;
    const queryString = new URLSearchParams(req.query).toString();
    req.log.info({queryString}, 'Начало получения пользователей');
    const users = await usersCircuit.fire(`${USERS_SERVICE_URL}/users${queryString ? '?' + queryString : ''}`, {
      headers: {'x-request-id' : requestId}
    });
    if (!users.success){
      req.log.warn({error: users.error}, 'Не удалось получить пользователей');
      return res.status(users.error?.code || 400).json(users)
    }
    req.log.info({usersCount: users.data.length}, 'Пользователи получены успешно');
    return res.json(users);
  } catch {
    req.log.error('Ошибка при получении пользователей');
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getUser = async (req, res) => {
  try {
    const requestId = req.requestId;
    const token = req.headers.authorization;
    req.log.info({user: req.params.userId}, 'Начало получения пользователя');
    const user = await usersCircuit.fire(`${USERS_SERVICE_URL}/users/${req.params.userId}`, {
      headers: {authorization: token, 'x-request-id' : requestId}
    });
    if (!user.success){
      req.log.warn({error: user.error}, 'Не удалось получить пользователя');
      return res.status(user.error?.code || 400).json(user)
    }
    req.log.info({userId: user.data.id}, 'Пользователь успешно получен');
    return res.json(user);
  } catch {
    req.log.error('Ошибка при получении пользователя');
    return res.status(500).json({ error: 'Internal server error' });
  }
};


exports.createUser = async (req, res) => {
  try {
    const requestId = req.requestId;
    const { name, password, email, roles } = req.body;
    
    req.log.info('Начало проверки полей');
    if (!name || !password || !email || !roles) {
      req.log.warn('Не все поля заполнены');
      return res.status(400).json({ 
        success: false, 
        error: {code: 400, message: 'Не все поля заполнены'} });
    }
    req.log.info('Проверка полей прошла успешно');
    const hashedPassword = await bcrypt.hash(password, 10);
    req.log.info('Начало создания пользователя');
    const user = await usersCircuit.fire(`${USERS_SERVICE_URL}/users`, {
      method: 'POST',
      headers: {'x-request-id' : requestId},
      data: {
        email,
        password: hashedPassword,
        name,
        roles
      }
    });
    if (!user.success){
      req.log.warn({error: user.error},'Не удалось создать пользователя');
      return res.status(user.error?.code || 400).json(user)
    }
    req.log.info({userId: user.data.id}, 'Пользователь успешно создан');
    return res.status(201).json(user);
  } catch {
    req.log.error('Ошибка при создании пользователя');
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const requestId = req.requestId;
    const token = req.headers.authorization;
    req.log.info({userId: req.params.userId},'Начало обновления пользователя');
    const user = await usersCircuit.fire(`${USERS_SERVICE_URL}/users/${req.params.userId}`, {
      method: 'PUT',
      headers: {authorization: token, 'x-request-id' : requestId},
      data: req.body
    });
    if (!user.success){
      req.log.warn({error: user.error},'Не удалось обновить пользователя');
      return res.status(user.error?.code || 400).json(user)
    }
    req.log.info({userId: user.data.id},'Пользователь успешно обновлен');
    return res.json(user);
  } catch {
    req.log.error('Ошибка при обновлении пользователя');
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const requestId = req.requestId;
    const token = req.headers.authorization;
    req.log.info({userId: req.params.userId},'Начало удаления пользователя');
    const result = await usersCircuit.fire(`${USERS_SERVICE_URL}/users/${req.params.userId}`, {
      method: 'DELETE',
      headers: {authorization: token, 'x-request-id' : requestId}
    });
    if (!result.success){
      req.log.warn({error: result.error},'Не удалось удалить пользователя');
      return res.status(result.error?.code || 400).json(result)
    }
    req.log.info({userId: result.data.id},'Пользователь успешно удален');
    return res.json(result);
  } catch {
    req.log.error('Ошибка при удалении пользователя');
    return res.status(500).json({ error: 'Internal server error' });
  }
};
