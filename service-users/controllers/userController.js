const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');


const dataPath = path.join(process.cwd(),'data');
const usersData = path.join(dataPath, 'users.json');
const rolesData = path.join(dataPath, 'roles.json');

function readJSON(file) {
    if (!fs.existsSync(file)) return [];
    const data = fs.readFileSync(file, 'utf-8');
    return JSON.parse(data);
}

function writeJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

function getUserFromToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
//получение всех
exports.getAllUsers = (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const roleFilter = parseInt(req.query.role);

    const users = readJSON(usersData);
    const roles = readJSON(rolesData);
    let result = users;
    if (roleFilter) {
      result = result.filter(u => u.roles.includes(roleFilter));
    }
    result = result.map(u => ({
          ...u,
          roles: u.roles.map(roleId => {
              const role = roles.find(r => r.id===roleId);
              return role ? role.name : null;
          }).filter(Boolean)
      }));

    if (page&&limit) {
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      result = result.slice(startIndex, endIndex);
    }


    res.json({
        success: true,
        data: result
    });
            

};
//получение по айди
exports.getUserById = (req, res) => {
    const currentUser = getUserFromToken(req);
    const users = readJSON(usersData);
    const userId = req.params.userId;
    const user = users.find(u => u.id===userId);
    if (!user) return res.status(404).json({
        success: false,
        error: {code: 404, message: 'Пользователь не найден'}
    });
      
    const isManager = currentUser.roles.includes(1); 

    const roleNames = user.roles.map(roleId => {
            const role = readJSON(rolesData).find(r => r.id===roleId);
            return role ? role.name : null;
        }).filter(Boolean)
    

  
    if (!isManager&&currentUser.id!==user.id){
          return res.status(403).json({ 
            success: false, 
            error: {code: 404, message: 'Доступ запрещен'} });
    }
    res.json({
        success: true,
        data: {
            ...user, 
            roles: roleNames
        }
    });
};
//получение по email
exports.getUserByEmail = async (req, res) => {
  try {
    const users = readJSON(usersData);
    const { email } = req.params;
    const user = users.find(u => u.email===email);
    if (!user) return res.status(404).json({
        success: false,
        error: {code: 404, message: 'Пользователь не найден'}
    });

    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Ошибка при поиске пользователя по email:', error.message);
    return res.status(500).json({
      success: false,
      error: {code: 404, message: 'Ошибка сервера при поиске пользователя'}
    });
  }
};
//добавить
exports.createUser = async (req, res) => {
    const users = readJSON(usersData);
    const {email, password, name, roles} = req.body;

    if (users.some(u => u.email === email)) {
        return res.status(404).json({ success: false, error: { code: 404, message: 'Этот email уже используется' } });
    }

    const { v4: uuid } = await import('uuid');
    const newUser = {
        id: uuid(),
        email,
        password: password,
        name,
        roles,
        date_of_creation: new Date().toISOString(),
        date_of_update: new Date().toISOString()
    };

    users.push(newUser);
    writeJSON(usersData, users);

    res.status(201).json({
        success: true, data: newUser});
};
//обновить
exports.updateUser = async (req, res) => {
    const currentUser = getUserFromToken(req);
    const users = readJSON(usersData);
    const userId = req.params.userId;
    const {email, name, roles} = req.body;

    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return res.status(404).json({ 
        success: false, 
        error: { code: 404, message: 'Пользователь не найден' } });

    const isManager = currentUser.roles.includes(1);
    if (!isManager && currentUser.id !== userId) {
      return res.status(403).json({ success: false, error: 'Нет прав на редактирование этого пользователя' });
    }

    const updates = {};
    if (email) {
      if (users.some(u => u.email === email)) {
        return res.status(404).json({ success: false, error: { code: 404, message: 'Этот email уже используется' } });
      }
      updates.email = email;
    }
    if (name) updates.name = name;
    if (roles && isManager) updates.roles = roles;

    const updatedUser = {
    ...users[userIndex],
    ...updates,
    date_of_update: new Date().toISOString()
     }; 

    users[userIndex] = updatedUser;
    writeJSON(usersData, users);

    res.status(201).json({success: true, data: updatedUser});
};
//удалить
exports.deleteUser = (req, res) => {
  const currentUser = getUserFromToken(req);
  const userId = req.params.userId;
  const users = readJSON(usersData);
  const userIndex = users.findIndex(u => u.id === userId);
  const isManager = currentUser.roles.includes(1);
  if (!isManager && currentUser.id !== userId) {
    return res.status(403).json({ 
      success: false, 
      error: {code: 403, message: 'Нет прав на удаление этого пользователя'} });
  }
  if (userIndex === -1) return res.status(404).json({ 
    success: false, 
    error: { code: 404, message: 'Пользователь не найден' } });

  if (users[userIndex].roles.includes(1)) {
    const allManagers = users.filter(u => u.roles.includes(1));
    if (allManagers.length <= 1) {
      return res.status(400).json({
        success: false,
        error: {code: 400, message: 'Невозможно удалить последнего менеджера'}
      });
    }
  }
  const deletedUser = users.splice(userIndex, 1)[0];
  writeJSON(usersData, users);

  res.json({ success: true, data: {
    message: 'Пользователь удален', 
    deletedUser }
    });
};
//другое
exports.healthCheck = (req, res) => {
  res.json({
    status: 'OK',
    service: 'Users Service',
    timestamp: new Date().toISOString()
  });
};

exports.statusCheck = (req, res) => {
  res.json({ status: 'Users service is running' });
};

