exports.checkRoles = (...allowedRoleIds) => {
  return (req, res, next) => {
    const userRoles = req.user?.roles || [];

    const hasAccess = userRoles.some(roleId => allowedRoleIds.includes(roleId));

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Доступ запрещён: недостаточно прав',
      });
    }

    next();
  };
};
