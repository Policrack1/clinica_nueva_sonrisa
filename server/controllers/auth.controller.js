// server/controllers/auth.controller.js
const db     = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

// POST /api/auth/login
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ ok: false, message: 'Email y contraseña requeridos' });
  }

  try {
    // 1. Modificado para traer también la columna 'estado' de la tabla usuarios
    const [rows] = await db.execute(
      `SELECT u.id_usuario, u.nombre, u.email, u.password_hash, u.activo, u.estado,
              r.nombre_rol AS rol, u.id_rol
       FROM usuarios u
       JOIN roles r ON u.id_rol = r.id_rol
       WHERE u.email = ?`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ ok: false, message: 'Credenciales incorrectas' });
    }

    const user = rows[0];

    if (!user.activo) {
      return res.status(403).json({ ok: false, message: 'Usuario desactivado' });
    }

    // 🔥 NUEVO CONTROL: Bloquear acceso si es Paciente y su estado es 'pendiente'
    if (user.rol === 'Paciente' && user.estado === 'pendiente') {
      return res.status(403).json({ 
        ok: false, 
        message: 'Tu registro está pendiente de aprobación por el Administrador.' 
      });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ ok: false, message: 'Credenciales incorrectas' });
    }

    // Obtener id_paciente o id_odontologo según rol
    let extra = {};
    if (user.rol === 'Paciente') {
      const [pac] = await db.execute(
        'SELECT id_paciente FROM pacientes WHERE id_usuario = ?',
        [user.id_usuario]
      );
      if (pac.length) extra.id_paciente = pac[0].id_paciente;
    }
    if (user.rol === 'Odontologo') {
      const [doc] = await db.execute(
        'SELECT id_odontologo FROM odontologos WHERE id_usuario = ?',
        [user.id_usuario]
      );
      if (doc.length) extra.id_odontologo = doc[0].id_odontologo;
    }

    const payload = {
      id_usuario: user.id_usuario,
      nombre:     user.nombre,
      email:      user.email,
      rol:        user.rol,
      ...extra,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    });

    res.json({
      ok: true,
      token,
      user: payload,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ ok: false, message: 'Error interno del servidor' });
  }
}

// GET /api/auth/me  (requiere token)
async function getMe(req, res) {
  try {
    const [rows] = await db.execute(
      `SELECT u.id_usuario, u.nombre, u.email, u.activo, u.estado, u.fecha_creacion,
              r.nombre_rol AS rol
       FROM usuarios u
       JOIN roles r ON u.id_rol = r.id_rol
       WHERE u.id_usuario = ?`,
      [req.user.id_usuario]
    );

    if (!rows.length) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
    }

    res.json({ ok: true, user: rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error interno' });
  }
}

// 🔥 NUEVA FUNCIÓN: POST /api/auth/register-paciente
async function registerPaciente(req, res) {
  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ ok: false, message: 'Todos los campos son requeridos' });
  }

  try {
    // Verificar si el correo ya existe en la BD
    const [existing] = await db.execute('SELECT id_usuario FROM usuarios WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ ok: false, message: 'El correo electrónico ya está registrado.' });
    }

    // Buscar el id_rol correspondiente a 'Paciente' dinámicamente
    const [rolRow] = await db.execute("SELECT id_rol FROM roles WHERE nombre_rol = 'Paciente'");
    const id_rol = rolRow.length > 0 ? rolRow[0].id_rol : 3; // Usa 3 por defecto si no lo encuentra

    // Encriptar la contraseña introducida por el usuario
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insertar el nuevo usuario con activo = 1 y estado = 'pendiente'
    await db.execute(
      `INSERT INTO usuarios (id_rol, nombre, email, password_hash, activo, estado) 
       VALUES (?, ?, ?, ?, 1, 'pendiente')`,
      [id_rol, nombre, email, passwordHash]
    );

    res.status(201).json({ 
      ok: true, 
      message: 'Registro recibido con éxito. En espera de aprobación por el Administrador.' 
    });
  } catch (err) {
    console.error('Register paciente error:', err);
    res.status(500).json({ ok: false, message: 'Error al procesar el registro del paciente' });
  }
}

module.exports = { login, getMe, registerPaciente };