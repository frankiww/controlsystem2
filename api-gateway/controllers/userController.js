const { USERS_SERVICE_URL } = require('../config/services');
const usersCircuit = require('../circuits/usersCircuit');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await usersCircuit.fire(`${USERS_SERVICE_URL}/users`);
    res.json(users);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await usersCircuit.fire(`${USERS_SERVICE_URL}/users/${req.params.userId}`);
    if (user.error === 'User not found') return res.status(404).json(user);
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};


exports.createUser = async (req, res) => {
  try {
    const user = await usersCircuit.fire(`${USERS_SERVICE_URL}/users`, {
      method: 'POST',
      data: req.body
    });
    res.status(201).json(user);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await usersCircuit.fire(`${USERS_SERVICE_URL}/users/${req.params.userId}`, {
      method: 'PUT',
      data: req.body
    });
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const result = await usersCircuit.fire(`${USERS_SERVICE_URL}/users/${req.params.userId}`, {
      method: 'DELETE'
    });
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};
