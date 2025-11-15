const { USERS_SERVICE_URL } = require('../config/services');
const usersCircuit = require('../circuits/usersCircuit');
const bcrypt = require('bcryptjs');

exports.getAllUsers = async (req, res) => {
  try {
    const requestId = req.requestId;
    const queryString = new URLSearchParams(req.query).toString();
    const users = await usersCircuit.fire(`${USERS_SERVICE_URL}/users${queryString ? '?' + queryString : ''}`, {
      headers: {'x-request-id' : requestId}
    });
    if (!users.success){
      return res.status(users.error?.code || 400).json(users)
    }
    return res.json(users);
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getUser = async (req, res) => {
  try {
    const requestId = req.requestId;
    const token = req.headers.authorization;
    const user = await usersCircuit.fire(`${USERS_SERVICE_URL}/users/${req.params.userId}`, {
      headers: {authorization: token, 'x-request-id' : requestId}
    });
    if (!user.success){
      return res.status(user.error?.code || 400).json(user)
    }
    return res.json(user);
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
};


exports.createUser = async (req, res) => {
  try {
    const requestId = req.requestId;
    const { name, password, email, roles } = req.body;

    if (!name || !password || !email || !roles) {
      return res.status(400).json({ 
        success: false, 
        error: {code: 400, message: 'Не все поля заполнены'} });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
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
      return res.status(user.error?.code || 400).json(user)
    }
    return res.status(201).json(user);
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const requestId = req.requestId;
    const token = req.headers.authorization;
    const user = await usersCircuit.fire(`${USERS_SERVICE_URL}/users/${req.params.userId}`, {
      method: 'PUT',
      headers: {authorization: token, 'x-request-id' : requestId},
      data: req.body
    });
    if (!user.success){
      return res.status(user.error?.code || 400).json(user)
    }
    return res.json(user);
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const requestId = req.requestId;
    const token = req.headers.authorization;
    const result = await usersCircuit.fire(`${USERS_SERVICE_URL}/users/${req.params.userId}`, {
      method: 'DELETE',
      headers: {authorization: token, 'x-request-id' : requestId}
    });
    if (!result.success){
      return res.status(result.error?.code || 400).json(result)
    }
    return res.json(result);
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
};
