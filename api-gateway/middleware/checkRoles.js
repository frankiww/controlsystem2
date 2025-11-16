exports.checkRoles = (...allowedRoleIds) => {
  return (req, res, next) => {
    const userRoles = req.user?.roles || [];

    const hasAccess = userRoles.some(roleId => allowedRoleIds.includes(roleId));

    if (!hasAccess) {
      req.log.warn({userRoles, requiredR: allowedRoleIds}, "Доступ запрещен");
      return res.status(403).json({
        success: false,
        error: {cpde: 403, message: 'Доступ запрещён: недостаточно прав'},
      });
    }

    req.log.info("Проверка ролей пройдена");
    next();
  };
};
