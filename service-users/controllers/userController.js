const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');
const { userValidation } = require('../validation/userValidation');


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
    req.log.info({filters: req.query},'Начало получения пользователей');
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
    req.log.info({usersCount: result.length},'Пользователи успешно получены');
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
    req.log.info({userId},'Начало получения пользователя по айди');
    const user = users.find(u => u.id===userId);
    if (!user){ 
      req.log.warn('Не удалось найти пользователя');
      return res.status(404).json({
        success: false,
        error: {code: 404, message: 'Пользователь не найден'}
    });}
      
    const isManager = currentUser.roles.includes(1); 

    const roleNames = user.roles.map(roleId => {
            const role = readJSON(rolesData).find(r => r.id===roleId);
            return role ? role.name : null;
        }).filter(Boolean)
  
    req.log.info('Начало проверки прав');
    if (!isManager&&currentUser.id!==user.id){
          req.log.warn('Доступ запрещен');
          return res.status(403).json({ 
            success: false, 
            error: {code: 403, message: 'Доступ запрещен'} });
    }
    req.log.info('Проверка прав прошла успешно');
    req.log.info('Получение пользователя прошло успешно');
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
    req.log.info({email},'Начало получения пользователя по email');
    const user = users.find(u => u.email===email);
    if (!user) {
      req.log.warn('Пользователь не найден');
      return res.status(404).json({
        success: false,
        error: {code: 404, message: 'Пользователь не найден'}
    });}
    req.log.info({userId: user.id},'Получение пользователя прошло успешно');
    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    req.log.error('Ошибка при получении пользователя по email');
    return res.status(500).json({
      success: false,
      error: {code: 500, message: 'Ошибка сервера при поиске пользователя'}
    });
  }
};
//добавить
exports.createUser = async (req, res) => {
    req.log.info('Начало создания пользователя');
    req.log.info('Начало валидации данных');
    const parseResult = userValidation.safeParse(req.body);
    if (!parseResult.success) {
      req.log.warn({error: parseResult.error.issues},'Валидация данных не пройдена');
      return res.status(400).json({
        code: 400,
        message: parseResult.error.issues
      });
    }
    req.log.info('Валидация данных прошла успешно');
    const users = readJSON(usersData);
    const {email, password, name, roles} = parseResult.data;
    req.log.info('Начало создания пользователя');
    if (users.some(u => u.email === email)) {
      req.log.warn({email},'Не удалось создать пользователя. Этот email уже используется');
        return res.status(409).json({ success: false, error: { code: 409, message: 'Этот email уже используется' } });
    }

    const { v4: uuid } = await import('uuid');
    const newUser = {
        id: uuid(),
        email,
        password,
        name,
        roles,
        date_of_creation: new Date().toISOString(),
        date_of_update: new Date().toISOString()
    };
    req.log.info({userId: newUser.id},'Пользователь успешно создан');
    users.push(newUser);
    writeJSON(usersData, users);

    res.status(201).json({
        success: true, data: newUser});
};
//обновить
exports.updateUser = async (req, res) => {
  req.log.info('Начало обновления пользователя');
  req.log.info('Начало валидации данных');
  const parseResult = userValidation.safeParse(req.body);
    if (!parseResult.success) {
      req.log.warn({error: parseResult.error.issues},'Валидация данных не пройдена');
      return res.status(400).json({
        code: 400,
        message: parseResult.error.issues
      });
    }
    req.log.info('Валидация данных прошла успешно');
    const currentUser = getUserFromToken(req);
    const users = readJSON(usersData);
    const userId = req.params.userId;
    const {email, name, roles} = parseResult.data;
    req.log.info({userId},'Начало получения пользователя');
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      req.log.warn('Пользователь на найден');
      return res.status(404).json({ 
        success: false, 
        error: { code: 404, message: 'Пользователь не найден' } });
      }
    req.log.info('Получение пользователя прошло успешно');
    req.log.info('Начало проверки доступа');
    const isManager = currentUser.roles.includes(1);
    if (!isManager && currentUser.id !== userId) {
      req.log.warn('Доступ запрещен');
      return res.status(403).json({ 
        success: false, 
        error: {code: 403, message: 'Нет прав на редактирование этого пользователя'} });
    }
    req.log.info('Проверка доступа прошла успешно');
    const updates = {};
    if (email) {
      req.log.info('');
      if (users.some(u => u.email === email)) {
        return res.status(409).json({ success: false, error: { code: 409, message: 'Этот email уже используется' } });
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
    req.log.info({userId: updatedUser.id},'Обновление пользователя прошло успешно');
    users[userIndex] = updatedUser;
    writeJSON(usersData, users);

    res.status(201).json({success: true, data: updatedUser});
};
//удалить
exports.deleteUser = (req, res) => {
  req.log.info('Начало удаления пользователя');
  const currentUser = getUserFromToken(req);
  const userId = req.params.userId;
  const users = readJSON(usersData);
  const userIndex = users.findIndex(u => u.id === userId);
  const isManager = currentUser.roles.includes(1);
  req.log.info('Начало проверки доступа');
  if (!isManager && currentUser.id !== userId) {
    req.log.warn('Доступ запрещен');
    return res.status(403).json({ 
      success: false, 
      error: {code: 403, message: 'Нет прав на удаление этого пользователя'} });
  }
  req.log.info('Проверка доступа прошла успешно');
  req.log.info({userId},'Начало получения пользователя');
  if (userIndex === -1) {
    req.log.warn('Пользователь не найден');
    return res.status(404).json({ 
    success: false, 
    error: { code: 404, message: 'Пользователь не найден' } });
  }
  req.log.info('Получение пользователя прошло успешно');
  req.log.info('Начало проверки на последнего менеджера');
  if (users[userIndex].roles.includes(1)) {
    const allManagers = users.filter(u => u.roles.includes(1));
    if (allManagers.length <= 1) {
      req.log.warn('Не удалось удалить пользователя. Нельзя удалить последнего менеджера');
      return res.status(400).json({
        success: false,
        error: {code: 400, message: 'Невозможно удалить последнего менеджера'}
      });
    }
  }
  req.log.info('Проверка прошла успешно');
  const deletedUser = users.splice(userIndex, 1)[0];
  req.log.info({userId: deletedUser.id},'Удаление пользователя прошло успешно');
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

