// server/controllers/citas.controller.js
const db = require('../config/db');

// GET /api/citas  — admin ve todas, doctor las suyas, paciente las suyas
async function getAll(req, res) {
  try {
    console.log('USUARIO TOKEN:', req.user)

    let query = `SELECT * FROM vista_citas WHERE 1=1`;
    const params = [];

    // 🔥 FILTRO PARA ODONTÓLOGO
    if (req.user.rol === 'Odontologo') {
      query += ' AND id_odontologo = ?';
      params.push(req.user.id_odontologo);
    }

    // 🔥 CORRECCIÓN: FILTRO PARA PACIENTE
    if (req.user.rol === 'Paciente') {
      query += ' AND id_paciente = ?';
      params.push(req.user.id_paciente);
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

// GET /api/citas/stats  — estadísticas para dashboard de Nueva Sonrisa
async function getStats(req, res) {
  try {
    let whereClause = '';
    const paramsCitas = [];
    const paramsPacientes = [];

    // Filtro por rol
    if (req.user.rol === 'Odontologo') {
      whereClause = 'AND id_odontologo = ?';
      paramsCitas.push(req.user.id_odontologo);
      paramsPacientes.push(req.user.id_odontologo);
    } else if (req.user.rol === 'Paciente') {
      whereClause = 'AND id_paciente = ?';
      paramsCitas.push(req.user.id_paciente);
      paramsPacientes.push(req.user.id_paciente);
    }

    // 1. Citas de HOY (Filtrando estrictamente por la fecha actual)
    const [[citasHoy]] = await db.execute(
      `SELECT COUNT(*) AS total FROM citas 
       WHERE CURDATE() = DATE(fecha_cita) ${whereClause}`, 
      paramsCitas
    );

    // 2. Citas programadas/confirmadas para ESTA SEMANA (Lunes a Domingo actual)
    const [[citasSemana]] = await db.execute(
      `SELECT COUNT(*) AS total FROM citas 
       WHERE YEARWEEK(fecha_cita, 1) = YEARWEEK(CURDATE(), 1) 
         AND estado IN ('programada', 'confirmada') ${whereClause}`, 
      paramsCitas
    );

    // 3. Cantidad de pacientes ÚNICOS asignados
    const [[misPacientes]] = await db.execute(
      `SELECT COUNT(DISTINCT id_paciente) AS total FROM citas 
       WHERE 1=1 ${whereClause}`, 
      paramsPacientes
    );

    // Mandamos el objeto exacto estructurado para el frontend
    res.json({
      ok: true,
      data: {
        citas_hoy: citasHoy.total,
        citas_semana: citasSemana.total,
        mis_pacientes: misPacientes.total
      }
    });
  } catch (err) {
    console.error("Error en getStats:", err);
    res.status(500).json({ ok: false, message: 'Error al obtener estadísticas' });
  }
}

// PUT /api/citas/:id/evolucion — Guarda la evolución en el historial clínico real
async function updateEvolucion(req, res) {
  const { evolucion } = req.body;
  const id_cita = req.params.id;

  if (!evolucion) {
    return res.status(400).json({ ok: false, message: 'El reporte de evolución no puede estar vacío' });
  }

  try {
    // 1. Buscamos el id_paciente asociado a esta cita
    const [citaRows] = await db.execute(
      'SELECT id_paciente FROM citas WHERE id_cita = ?',
      [id_cita]
    );

    if (!citaRows.length) {
      return res.status(404).json({ ok: false, message: 'Cita no encontrada' });
    }

    const { id_paciente } = citaRows[0];

    // 2. Insertamos o actualizamos en historial_clinico usando la sintaxis VALUES() alineada a tu otro controlador
    await db.execute(
      `INSERT INTO historial_clinico (id_cita, id_paciente, diagnostico, trat_realizado, medicamentos)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE diagnostico = VALUES(diagnostico)`, 
      [id_cita, id_paciente, evolucion, 'Evolución de cita', 'Ninguno']
    );

    // 3. Mantenemos la actualización en la tabla citas por consistencia del estado del modal
    await db.execute('UPDATE citas SET evolucion = ? WHERE id_cita = ?', [evolucion, id_cita]);

    res.json({ ok: true, message: 'Evolución guardada con éxito en el Historial Clínico' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al registrar en el historial clínico' });
  }
}

module.exports = { getAll, getOne, create, update, remove, getStats, updateEvolucion };