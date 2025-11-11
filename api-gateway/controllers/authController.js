const axios = require('axios');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/jwt');
const { USERS_SERVICE_URL } = require('../config/services');
const usersCircuit = require('../circuits/usersCircuit');

exports.register = async (req, res) => {
  try {
    const { name, password, email } = req.body;

    if (!name || !password || !email) {
      return res.status(400).json({ success: false, error: 'Не все поля заполнены' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const response = await usersCircuit.fire(`${USERS_SERVICE_URL}/users`, {
      method: 'POST',
      data: {
        email,
        password: hashedPassword,
        name,
        roles: [3]
      }
    });
    
    if (!response.success) {
      return res.status(404).json({
          success: false,
          error: response.error || 'Ошибка при создании пользователя'
        });
      }

    return res.status(201).json({ success: true, data: response.data });
  } catch (error) {
    console.error('Ошибка при регистрации:', error.message);
    return res.status(500).json({ success: false, error: 'Ошибка при регистрации' });
  }
}

exports.login = async (req, res) =>  {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Введите логин и пароль' });
    }
    const response = await usersCircuit.fire(`${USERS_SERVICE_URL}/users/by-email/${email}`);
    const user = response.data;

    if (!user) {
      return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    }

    // Проверяем пароль
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, error: 'Неверный пароль' });
    }

    // Формируем токен
    const token = jwt.sign(
      { id: user.id, roles: user.roles, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(200).json({ success: true, data: token });
  } catch (error) {
    console.error('Ошибка при входе:', error.message);
    return res.status(500).json({ success: false, error: 'Ошибка при входе' });
  }
}
