// server/middleware/role.middleware.js
 
// Uso: router.get('/ruta', verifyToken, allowRoles('Administrador'), handler)
function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ ok: false, message: 'No autenticado' });
    }
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({
        ok: false,
        message: `Acceso denegado. Requiere rol: ${roles.join(' o ')}`
      });
    }
    next();
  };
}
 
module.exports = { allowRoles };