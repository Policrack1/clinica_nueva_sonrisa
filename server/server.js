// server/server.js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const routes  = require('./routes/index');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middlewares ──
// ── Middlewares ──

// Lista de orígenes permitidos
// En server/server.js
const allowedOrigins = [
  'http://localhost:5173',
  'https://clinica-nueva-sonrisa.vercel.app' // ¡AQUÍ AGREGA ESTO!
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado por CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Rutas API ──
app.use('/api', routes);

// ── Health check ──
app.get('/', (req, res) => {
  res.json({
    ok: true,
    message: '🦷 Nueva Sonrisa API corriendo',
    version: '1.0.0',
    endpoints: '/api/auth, /api/citas, /api/pacientes, /api/historial, /api/asistencia, /api/notificaciones, /api/tratamientos, /api/odontologos, /api/usuarios'
  });
});

// ── 404 ──
app.use((req, res) => {
  res.status(404).json({ ok: false, message: `Ruta no encontrada: ${req.method} ${req.path}` });
});

// ── Error global ──
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ ok: false, message: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`\n🦷 Nueva Sonrisa Server corriendo en http://localhost:${PORT}`);
  console.log(`📋 Ambiente: ${process.env.NODE_ENV || 'development'}\n`);
});