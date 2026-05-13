// server/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ ok: false, message: 'Token requerido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id_usuario, email, rol, nombre }
    next();
  } catch (err) {
    return res.status(403).json({ ok: false, message: 'Token inválido o expirado' });
  }
}

module.exports = { verifyToken };