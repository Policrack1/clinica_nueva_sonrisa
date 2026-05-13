async function getHistorialByPaciente(req, res) {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM vista_historial WHERE id_paciente = ? ORDER BY fecha_cita DESC',
      [req.params.id_paciente]
    );
    res.json({ ok: true, data: rows });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al obtener historial' });
  }
}
 
async function createHistorial(req, res) {
  const { id_cita, id_paciente, diagnostico, trat_realizado, medicamentos, proxima_revision } = req.body;
  if (!id_cita || !id_paciente) return res.status(400).json({ ok: false, message: 'Campos requeridos' });
  try {
    await db.execute(
      `INSERT INTO historial_clinico (id_cita, id_paciente, diagnostico, trat_realizado, medicamentos, proxima_revision)
       VALUES (?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE diagnostico=VALUES(diagnostico), trat_realizado=VALUES(trat_realizado),
       medicamentos=VALUES(medicamentos), proxima_revision=VALUES(proxima_revision)`,
      [id_cita, id_paciente, diagnostico||'', trat_realizado||'', medicamentos||'', proxima_revision||null]
    );
    res.json({ ok: true, message: 'Historial guardado' });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al guardar historial' });
  }
}
 
module.exports = { getHistorialByPaciente, createHistorial };