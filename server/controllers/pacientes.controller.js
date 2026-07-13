const db = require('../config/db');

async function getAll(req, res) {
  try {
    // Agregamos las columnas de usuarios al GROUP BY para cumplir con ONLY_FULL_GROUP_BY
    let query = `
      SELECT p.*, u.nombre, u.email, u.activo, u.estado,
             COUNT(c.id_cita) AS total_citas
      FROM pacientes p
      JOIN usuarios u ON p.id_usuario = u.id_usuario
      LEFT JOIN citas c ON p.id_paciente = c.id_paciente
      WHERE 1=1`;
    const params = [];

    if (req.query.q) {
      query += ' AND (u.nombre LIKE ? OR p.dni LIKE ?)';
      params.push(`%${req.query.q}%`, `%${req.query.q}%`);
    }

    // Odontólogo solo ve sus pacientes
    if (req.user.rol === 'Odontologo') {
      query += ` AND p.id_paciente IN (
        SELECT DISTINCT id_paciente FROM citas WHERE id_odontologo = ?
      )`;
      params.push(req.user.id_odontologo);
    }

    // Corrección de Agrupación Estricta SQL
    query += ' GROUP BY p.id_paciente, u.nombre, u.email, u.activo, u.estado ORDER BY u.nombre ASC';
    
    const [rows] = await db.execute(query, params);
    res.json({ ok: true, data: rows });
  } catch (err) {
    console.error('Error en getAll pacientes:', err);
    res.status(500).json({ ok: false, message: 'Error al obtener pacientes' });
  }
}

async function getOne(req, res) {
  try {
    const [rows] = await db.execute(
      `SELECT p.*, u.nombre, u.email FROM pacientes p
       JOIN usuarios u ON p.id_usuario = u.id_usuario
       WHERE p.id_paciente = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ ok: false, message: 'Paciente no encontrado' });
    res.json({ ok: true, data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error interno' });
  }
}

async function create(req, res) {
  const { nombre, email, password, dni, telefono, fecha_nacimiento, genero, grupo_sanguineo, alergias, direccion } = req.body;
  if (!nombre || !email || !password || !dni) {
    return res.status(400).json({ ok: false, message: 'Campos requeridos incompletos' });
  }
  const bcrypt = require('bcryptjs');
  try {
    const hash = await bcrypt.hash(password, 10);
    
    // Agregamos explícitamente el 'estado' como 'aprobado' cuando el Admin crea un paciente desde el panel
    const [usuRes] = await db.execute(
      "INSERT INTO usuarios (id_rol, nombre, email, password_hash, activo, estado) VALUES (3, ?, ?, ?, 1, 'aprobado')",
      [nombre, email, hash]
    );
    
    await db.execute(
      `INSERT INTO pacientes (id_usuario, dni, telefono, fecha_nacimiento, genero, grupo_sanguineo, alergias, direccion)
       VALUES (?,?,?,?,?,?,?,?)`,
      [usuRes.insertId, dni, telefono||null, fecha_nacimiento||null, genero||'Masculino', grupo_sanguineo||'O+', alergias||'Ninguna', direccion||null]
    );
    res.status(201).json({ ok: true, message: 'Paciente registrado con éxito' });
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY' || err.sqlState === '23000') {
      return res.status(409).json({ ok: false, message: 'El Email o DNI ya se encuentra registrado' });
    }
    res.status(500).json({ ok: false, message: 'Error al registrar paciente' });
  }
}

async function update(req, res) {
  const { telefono, alergias, direccion, grupo_sanguineo } = req.body;
  try {
    await db.execute(
      'UPDATE pacientes SET telefono=?, alergias=?, direccion=?, grupo_sanguineo=? WHERE id_paciente=?',
      [telefono, alergias, direccion, grupo_sanguineo, req.params.id]
    );
    res.json({ ok: true, message: 'Paciente actualizado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al actualizar' });
  }
}
// POST /api/pacientes/vincular — Vincula un usuario ya existente como paciente
async function vincularUsuario(req, res) {
  const { id_usuario, dni, telefono, grupo_sanguineo, alergias, direccion } = req.body;

  if (!id_usuario || !dni) {
    return res.status(400).json({ ok: false, message: 'El usuario y el DNI son obligatorios' });
  }

  try {
    // 1. Insertamos al usuario en la tabla pacientes
    await db.execute(
      `INSERT INTO pacientes (id_usuario, dni, telefono, grupo_sanguineo, alergias, direccion) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_usuario, dni, telefono || null, grupo_sanguineo || 'O+', alergias || 'Ninguna', direccion || null]
    );

    // 2. Actualizamos el rol del usuario a Paciente (id_rol = 3 según tu lógica de create)
    await db.execute(
      `UPDATE usuarios SET id_rol = 3 WHERE id_usuario = ?`,
      [id_usuario]
    );

    res.status(201).json({ ok: true, message: 'Usuario vinculado exitosamente como paciente' });
  } catch (err) {
    console.error('Error al vincular paciente:', err);
    res.status(500).json({ ok: false, message: 'Error al vincular el usuario como paciente' });
  }
}

module.exports = { getAll, getOne, create, update, vincularUsuario };