const db = require('../config/db');

async function getAsistencia(req, res) {
  try {
    // Partimos de vista_citas para asegurar que salgan TODAS las citas, 
    // y traemos la asistencia si existe con un LEFT JOIN.
    const [rows] = await db.execute(
      `SELECT 
        vc.id_cita,
        vc.fecha_cita,
        vc.hora_cita,
        vc.nombre_paciente,
        vc.tratamiento AS nombre_tratamiento,
        vc.nombre_odontologo,
        COALESCE(a.id_asistencia, 0) AS id_asistencia,
        COALESCE(a.estado, 'pendiente') AS estado,
        COALESCE(a.observacion, '') AS observacion
       FROM vista_citas vc
       LEFT JOIN asistencia a ON vc.id_cita = a.id_cita
       ORDER BY vc.fecha_cita DESC, vc.hora_cita ASC`
    );

    res.json({ ok: true, data: rows });
  } catch (err) {
    console.error('Error en getAsistencia:', err);
    res.status(500).json({ ok: false, message: 'Error al obtener asistencia' });
  }
}

async function registrarAsistencia(req, res) {
  const { id_cita, estado, observacion } = req.body;
  if (!id_cita || !estado) {
    return res.status(400).json({ ok: false, message: 'Campos requeridos' });
  }

  try {
    // Insertamos o actualizamos en la tabla asistencia
    await db.execute(
      `INSERT INTO asistencia (id_cita, estado, observacion) 
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE estado = VALUES(estado), observacion = VALUES(observacion)`,
      [id_cita, estado, observacion || '']
    );

    // Mapeamos el estado de la asistencia al estado correspondiente de la cita
    let estadoCita = 'programada';
    if (estado === 'asistio') estadoCita = 'completada';
    if (estado === 'cancelado') estadoCita = 'cancelada';
    if (estado === 'no_asistio') estadoCita = 'no_asistio'; // Por si manejas este estado en tu UI

    // Sincronizamos la tabla citas
    await db.execute('UPDATE citas SET estado = ? WHERE id_cita = ?', [estadoCita, id_cita]);

    res.json({ ok: true, message: 'Asistencia registrada con éxito' });
  } catch (err) {
    console.error('Error en registrarAsistencia:', err);
    res.status(500).json({ ok: false, message: 'Error al registrar asistencia' });
  }
}

module.exports = { getAsistencia, registrarAsistencia };