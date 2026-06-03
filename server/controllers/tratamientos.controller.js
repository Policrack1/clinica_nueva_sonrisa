const db = require('../config/db');
async function getTratamientos(req, res) {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM tratamientos WHERE activo = true ORDER BY nombre_tratamiento'
    );

    res.json({
      ok: true,
      data: rows
    });

  } catch (err) {
  console.error(err);

  res.status(500).json({
    ok: false,
    message: err.message
  });
}
}

module.exports = { getTratamientos };