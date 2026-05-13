async function getAllUsuarios(req, res) {
  try {
    const [rows] = await db.execute(
      `SELECT u.id_usuario, u.nombre, u.email, u.activo, u.fecha_creacion, r.nombre_rol AS rol
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
 
module.exports = { getAllUsuarios, toggleActivo };