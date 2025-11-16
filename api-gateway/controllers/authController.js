const axios = require('axios');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/jwt');
const { USERS_SERVICE_URL } = require('../config/services');
const usersCircuit = require('../circuits/usersCircuit');

exports.register = async (req, res) => {
  try {
    const requestId = req.requestId;
    const { name, password, email } = req.body;

    req.log.info('Начало проверки полей');
    if (!name || !password || !email) {
      req.log.warn('Не все поля заполнены');
      return res.status(400).json({ success: false, error: 'Не все поля заполнены' });
    }
    req.log.info('Проверка полей прошла успешно');

    const hashedPassword = await bcrypt.hash(password, 10);
    req.log.info('Начало регистрации');
    const response = await usersCircuit.fire(`${USERS_SERVICE_URL}/users`, {
      method: 'POST',
      headers: {'x-request-id' : requestId},
      data: {
        email,
        password: hashedPassword,
        name,
        roles: [3]
      }
    });
    
    if (!response.success) {
      req.log.warn({error: response.error},'Не удалось зарегистрироваться');
      return res.status(response.error?.code || 400).json(response)
    }
    req.log.info({userId: response.data.id},'Регистрация прошла успешно');
    return res.status(201).json({ success: true, data: response.data });
  } catch (error) {
    req.log.error('Ошибка при регистрации');
    return res.status(500).json({ success: false, error: 'Ошибка при регистрации' });
  }
}

exports.login = async (req, res) =>  {
  try {
    const requestId = req.requestId;
    const { email, password } = req.body;

    req.log.info('Начало проверки полей');
    if (!email || !password) {
      req.log.warn('Не все поля заполнены');
      return res.status(400).json({ success: false, error: 'Введите логин и пароль' });
    }
    req.log.info('Проверка полей прошла успешно');
    req.log.info('Начало получения пользователя');
    const response = await usersCircuit.fire(`${USERS_SERVICE_URL}/users/by-email/${email}`, {
      headers: {'x-request-id' : requestId}
    });
    if (!response.success){
      req.log.warn({error: response.error},'Не удалось получить пользователя');
      return res.status(response.error?.code || 400).json(response)
    }
    req.log.info({userId: response.data.id},'Пользователь получен успешно');
    const user = response.data;
    req.log.info('Начало проверки пароля');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      req.log.warn('Неверный пароль');
      return res.status(401).json({ success: false, error: 'Неверный пароль' });
    }
    req.log.info('Проверка пароля прошла успешно');

    const token = jwt.sign(
      { id: user.id, roles: user.roles, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    req.log.info({userId: user.id},'Вход выполнен');
    return res.status(200).json({ success: true, data: token });
  } catch (error) {
    req.log.error('Ошибка при выходе');
    return res.status(500).json({ success: false, error: 'Ошибка при входе' });
  }
}
