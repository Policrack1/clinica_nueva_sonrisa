// server/server.js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const routes  = require('./routes/index');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middlewares ──

// Configuración de CORS flexible para permitir el acceso desde navegadores móviles y entornos locales
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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

// Escuchar en el host '0.0.0.0' para que acepte conexiones externas en tu red local (como tu celular)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🦷 Nueva Sonrisa Server corriendo en http://0.0.0.0:${PORT}`);
  console.log(`📋 Ambiente: ${process.env.NODE_ENV || 'development'}\n`);
});