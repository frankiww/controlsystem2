const { USERS_SERVICE_URL } = require('../config/services');
const usersCircuit = require('../circuits/usersCircuit');
const bcrypt = require('bcryptjs');

exports.getAllUsers = async (req, res) => {
  try {
    const queryString = new URLSearchParams(req.query).toString();
    const users = await usersCircuit.fire(`${USERS_SERVICE_URL}/users${queryString ? '?' + queryString : ''}`);
    res.json(users);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getUser = async (req, res) => {
  try {
    const token = req.headers.authorization;
    const user = await usersCircuit.fire(`${USERS_SERVICE_URL}/users/${req.params.userId}`, {
      headers: {authorization: token}
    });
    if (user.error === 'User not found') return res.status(404).json(user);
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};


exports.createUser = async (req, res) => {
  try {
    const { name, password, email, roles } = req.body;

    if (!name || !password || !email || !roles) {
      return res.status(400).json({ success: false, error: 'Не все поля заполнены' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await usersCircuit.fire(`${USERS_SERVICE_URL}/users`, {
      method: 'POST',
      data: {
        email,
        password: hashedPassword,
        name,
        roles
      }
    });
    if (!user.success) {
      return res.status(404).json({
          success: false,
          error: user.error || 'Ошибка при создании пользователя'
        });
      }
    res.status(201).json(user);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const token = req.headers.authorization;
    const user = await usersCircuit.fire(`${USERS_SERVICE_URL}/users/${req.params.userId}`, {
      method: 'PUT',
      headers: {authorization: token},
      data: req.body
    });
    if (!user.success){
      res.status(user.error?.code || 400).json(user)
    }
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const token = req.headers.authorization;
    const result = await usersCircuit.fire(`${USERS_SERVICE_URL}/users/${req.params.userId}`, {
      method: 'DELETE',
      headers: {authorization: token}
    });
    if (!result.success){
      res.status(result.error?.code || 400).json(result)
    }
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};
