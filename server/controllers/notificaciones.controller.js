async function getMisNotificaciones(req, res) {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM notificaciones WHERE id_usuario=? ORDER BY fecha_envio DESC LIMIT 20',
      [req.user.id_usuario]
    );
    const [[ { total } ]] = await db.execute(
      'SELECT COUNT(*) AS total FROM notificaciones WHERE id_usuario=? AND leida=false',
      [req.user.id_usuario]
    );
    res.json({ ok: true, data: rows, no_leidas: total });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error' });
  }
}
 
async function marcarLeida(req, res) {
  try {
    if (req.params.id === 'all') {
      await db.execute('UPDATE notificaciones SET leida=true WHERE id_usuario=?', [req.user.id_usuario]);
    } else {
      await db.execute('UPDATE notificaciones SET leida=true WHERE id_notificacion=? AND id_usuario=?',
        [req.params.id, req.user.id_usuario]);
    }
    res.json({ ok: true, message: 'Marcada como leída' });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error' });
  }
}
 
module.exports = { getMisNotificaciones, marcarLeida };