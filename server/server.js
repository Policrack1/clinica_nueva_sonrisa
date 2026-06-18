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
const allowedOrigins = [
  'http://localhost:5173',                      // Tu frontend local (Vite)
  'http://127.0.0.1:5173',                     // Alternativa local
  process.env.CLIENT_URL                       // URL de Vercel cuando la tengas
].filter(Boolean); // .filter(Boolean) elimina valores undefined o vacíos

app.use(cors({
  origin: function (origin, callback) {
    // Permitir peticiones sin origen (como Postman, Insomnia o herramientas de desarrollo)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado por políticas de CORS de Nueva Sonrisa'));
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