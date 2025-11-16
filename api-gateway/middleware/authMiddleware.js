const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.log.warn("Попытка доступа без токена");
    return res.status(401).json({
      success: false,
      error: 'Требуется авторизация (отсутствует Bearer токен)',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    req.log.info("Токен проверен успешно");
    next();
  } catch (error) {
    req.log.warn({error}, "Недействительный токен");
    return res.status(401).json({
      success: false,
      error: 'Недействительный или просроченный токен',
    });
  }
};
