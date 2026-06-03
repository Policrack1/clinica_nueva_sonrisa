const db = require('../config/db');
async function getAsistencia(req, res) {
  try {
    const [rows] = await db.execute(
      `SELECT a.*, c.fecha_cita, c.hora_cita, vc.nombre_paciente, vc.nombre_tratamiento, vc.nombre_odontologo
       FROM asistencia a
       JOIN citas c ON a.id_cita = c.id_cita
       JOIN vista_citas vc ON a.id_cita = vc.id_cita
       ORDER BY c.fecha_cita DESC`
    );
    res.json({ ok: true, data: rows });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al obtener asistencia' });
  }
}
 
async function registrarAsistencia(req, res) {
  const { id_cita, estado, observacion } = req.body;
  if (!id_cita || !estado) return res.status(400).json({ ok: false, message: 'Campos requeridos' });
  try {
    await db.execute(
      `INSERT INTO asistencia (id_cita, estado, observacion) VALUES (?,?,?)
       ON DUPLICATE KEY UPDATE estado=VALUES(estado), observacion=VALUES(observacion)`,
      [id_cita, estado, observacion||'']
    );
    // Actualizar estado de cita
    const estadoCita = estado === 'asistio' ? 'completada' : estado === 'cancelado' ? 'cancelada' : 'programada';
    await db.execute('UPDATE citas SET estado=? WHERE id_cita=?', [estadoCita, id_cita]);
    res.json({ ok: true, message: 'Asistencia registrada' });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al registrar asistencia' });
  }
}
 
module.exports = { getAsistencia, registrarAsistencia };