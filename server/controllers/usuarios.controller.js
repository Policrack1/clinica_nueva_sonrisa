const db = require('../config/db');

async function getAllUsuarios(req, res) {
  try {
    // Modificado para traer también la columna 'estado' y que el admin lo vea en su lista general
    const [rows] = await db.execute(
      `SELECT u.id_usuario, u.nombre, u.email, u.activo, u.estado, u.fecha_creacion, r.nombre_rol AS rol
       FROM usuarios u JOIN roles r ON u.id_rol = r.id_rol ORDER BY u.id_usuario`
    );
    res.json({ ok: true, data: rows });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error' });
  }
}

async function toggleActivo(req, res) {
  try { 
    await db.execute(
      'UPDATE usuarios SET activo = NOT activo WHERE id_usuario = ?',
      [req.params.id]
    );
    res.json({ ok: true, message: 'Estado actualizado' });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error' });
  }
}

// 🔥 NUEVA FUNCIÓN: GET /api/usuarios/pendientes
async function getPacientesPendientes(req, res) {
  try {
    const [rows] = await db.execute(
      `SELECT u.id_usuario, u.nombre, u.email, u.activo, u.estado, u.fecha_creacion, r.nombre_rol AS rol
       FROM usuarios u 
       JOIN roles r ON u.id_rol = r.id_rol 
       WHERE r.nombre_rol = 'Paciente' AND u.estado = 'pendiente'
       ORDER BY u.id_usuario`
    );
    res.json({ ok: true, data: rows });
  } catch (err) {
    console.error('Error al obtener pendientes:', err);
    res.status(500).json({ ok: false, message: 'Error al obtener pacientes pendientes' });
  }
}

// 🔥 NUEVA FUNCIÓN: PUT /api/usuarios/:id/aprobar
async function aprobarPaciente(req, res) {
  try {
    const [result] = await db.execute(
      "UPDATE usuarios SET estado = 'aprobado' WHERE id_usuario = ? AND estado = 'pendiente'",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado o ya aprobado' });
    }

    res.json({ ok: true, message: 'Paciente aprobado con éxito' });
  } catch (err) {
    console.error('Error al aprobar paciente:', err);
    res.status(500).json({ ok: false, message: 'Error al aprobar el paciente' });
  }
}

module.exports = { 
  getAllUsuarios, 
  toggleActivo, 
  getPacientesPendientes, 
  aprobarPaciente 
};