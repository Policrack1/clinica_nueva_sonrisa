// server/controllers/citas.controller.js
const db = require('../config/db');

// GET /api/citas  — admin ve todas, doctor las suyas, paciente las suyas
async function getAll(req, res) {
  try {

    console.log('USUARIO TOKEN:', req.user)

    let query = `SELECT * FROM vista_citas WHERE 1=1`;
    const params = [];

    if (req.user.rol === 'Odontologo') {
      query += ' AND id_odontologo = ?';
      params.push(req.user.id_odontologo);
    }

    // Filtros opcionales por query params
    if (req.query.estado) {
      query += ' AND estado = ?';
      params.push(req.query.estado);
    }

    if (req.query.id_paciente) {
      query += ' AND id_paciente = ?';
      params.push(req.query.id_paciente);
    }

    if (req.query.fecha) {
      query += ' AND fecha_cita = ?';
      params.push(req.query.fecha);
    }

    if (req.query.mes) {
      query += ' AND MONTH(fecha_cita) = ? AND YEAR(fecha_cita) = ?';
      params.push(req.query.mes, req.query.anio || new Date().getFullYear());
    }

    query += ' ORDER BY fecha_cita DESC, hora_cita ASC';

    console.log('QUERY:', query)
    console.log('PARAMS:', params)

    const [rows] = await db.execute(query, params);

    console.log('CITAS ENCONTRADAS:', rows.length)

    res.json({ ok: true, data: rows });

  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al obtener citas' });
  }
}

// GET /api/citas/:id
async function getOne(req, res) {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM vista_citas WHERE id_cita = ?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ ok: false, message: 'Cita no encontrada' });
    res.json({ ok: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error interno' });
  }
}

// POST /api/citas
async function create(req, res) {
  const { id_paciente, id_odontologo, id_tratamiento, fecha_cita, hora_cita, notas } = req.body;

  if (!id_paciente || !id_odontologo || !id_tratamiento || !fecha_cita || !hora_cita) {
    return res.status(400).json({ ok: false, message: 'Campos requeridos incompletos' });
  }

  try {
    // Verificar que no haya conflicto de horario para el odontólogo
    const [conflict] = await db.execute(
      `SELECT id_cita FROM citas
       WHERE id_odontologo = ? AND fecha_cita = ? AND hora_cita = ?
         AND estado NOT IN ('cancelada')`,
      [id_odontologo, fecha_cita, hora_cita]
    );

    if (conflict.length) {
      return res.status(409).json({
        ok: false,
        message: 'El odontólogo ya tiene una cita en ese horario'
      });
    }

    const [result] = await db.execute(
      `INSERT INTO citas (id_paciente, id_odontologo, id_tratamiento, fecha_cita, hora_cita, notas)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_paciente, id_odontologo, id_tratamiento, fecha_cita, hora_cita, notas || '']
    );

    res.status(201).json({ ok: true, message: 'Cita creada', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al crear cita' });
  }
}

// PUT /api/citas/:id
async function update(req, res) {
  const { estado, fecha_cita, hora_cita, id_tratamiento, notas } = req.body;

  try {
    const fields = [];
    const params = [];

    if (estado) { fields.push('estado = ?'); params.push(estado); }
    if (fecha_cita) { fields.push('fecha_cita = ?'); params.push(fecha_cita); }
    if (hora_cita) { fields.push('hora_cita = ?'); params.push(hora_cita); }
    if (id_tratamiento) { fields.push('id_tratamiento = ?'); params.push(id_tratamiento); }
    if (notas !== undefined) { fields.push('notas = ?'); params.push(notas); }

    if (!fields.length) {
      return res.status(400).json({ ok: false, message: 'Nada que actualizar' });
    }

    params.push(req.params.id);
    await db.execute(`UPDATE citas SET ${fields.join(', ')} WHERE id_cita = ?`, params);

    // Si pasa a completada, registrar asistencia automáticamente
    if (estado === 'completada') {
      await db.execute(
        `INSERT INTO asistencia (id_cita, estado) VALUES (?, 'asistio')
         ON DUPLICATE KEY UPDATE estado = 'asistio'`,
        [req.params.id]
      );
    }

    if (estado === 'cancelada') {
      await db.execute(
        `INSERT INTO asistencia (id_cita, estado) VALUES (?, 'cancelado')
         ON DUPLICATE KEY UPDATE estado = 'cancelado'`,
        [req.params.id]
      );
    }

    res.json({ ok: true, message: 'Cita actualizada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al actualizar cita' });
  }
}

// DELETE /api/citas/:id  (solo admin)
async function remove(req, res) {
  try {
    await db.execute('DELETE FROM citas WHERE id_cita = ?', [req.params.id]);
    res.json({ ok: true, message: 'Cita eliminada' });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al eliminar' });
  }
}

// GET /api/citas/stats  — estadísticas para dashboard
async function getStats(req, res) {
  try {
    const today = new Date().toISOString().split('T')[0];
    let whereDoc = '';
    const params = [];

    if (req.user.rol === 'Odontologo') {
      whereDoc = 'AND id_odontologo = ?';
      params.push(req.user.id_odontologo);
    }

    const [[hoy]] = await db.execute(
      `SELECT COUNT(*) AS total FROM citas WHERE fecha_cita = ? ${whereDoc}`, [today, ...params]
    );
    const [[completadas]] = await db.execute(
      `SELECT COUNT(*) AS total FROM citas WHERE fecha_cita = ? AND estado = 'completada' ${whereDoc}`, [today, ...params]
    );
    const [[pendientes]] = await db.execute(
      `SELECT COUNT(*) AS total FROM citas WHERE fecha_cita = ? AND estado IN ('programada','confirmada') ${whereDoc}`, [today, ...params]
    );
    const [[semana]] = await db.execute(
      `SELECT COUNT(*) AS total FROM citas
       WHERE YEARWEEK(fecha_cita) = YEARWEEK(NOW()) ${whereDoc}`, params
    );
    let totalPacQuery = `
  SELECT COUNT(DISTINCT id_paciente) AS total
  FROM citas
`;

    const totalPacParams = [];

    if (req.user.rol === 'Odontologo') {
      totalPacQuery += ' WHERE id_odontologo = ?';
      totalPacParams.push(req.user.id_odontologo);
    }

    const [[totalPac]] = await db.execute(
      totalPacQuery,
      totalPacParams
    );

    res.json({
      ok: true,
      data: {
        citas_hoy: hoy.total,
        completadas_hoy: completadas.total,
        pendientes_hoy: pendientes.total,
        citas_semana: semana.total,
        total_pacientes: totalPac.total,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al obtener estadísticas' });
  }
}

module.exports = { getAll, getOne, create, update, remove, getStats };