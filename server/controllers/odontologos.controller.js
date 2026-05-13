async function getOdontologos(req, res) {
  try {
    const [rows] = await db.execute(
      `SELECT o.*, u.nombre, u.email, e.nombre_especialidad
       FROM odontologos o
       JOIN usuarios u ON o.id_usuario = u.id_usuario
       JOIN especialidades e ON o.id_especialidad = e.id_especialidad
       WHERE u.activo = true ORDER BY u.nombre`
    );
    res.json({ ok: true, data: rows });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error' });
  }
}
 
async function getPerfil(req, res) {
  try {
    const [rows] = await db.execute(
      `SELECT o.*, u.nombre, u.email, e.nombre_especialidad, e.descripcion AS esp_descripcion
       FROM odontologos o
       JOIN usuarios u ON o.id_usuario = u.id_usuario
       JOIN especialidades e ON o.id_especialidad = e.id_especialidad
       WHERE o.id_odontologo = ?`,
      [req.user.id_odontologo]
    );
    if (!rows.length) return res.status(404).json({ ok: false, message: 'No encontrado' });
    res.json({ ok: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error' });
  }
}
 
module.exports = { getOdontologos, getPerfil };
 