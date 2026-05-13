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
    res.status(500).json({
      ok: false,
      message: 'Error'
    });
  }
}

module.exports = { getTratamientos };