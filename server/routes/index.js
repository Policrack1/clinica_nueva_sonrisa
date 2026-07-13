const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');

// Controllers
const authCtrl = require('../controllers/auth.controller');
const citasCtrl = require('../controllers/citas.controller');
const pacientesCtrl = require('../controllers/pacientes.controller');
const historialCtrl = require('../controllers/historial.controller');
const asistenciaCtrl = require('../controllers/asistencia.controller');
const notificacionesCtrl = require('../controllers/notificaciones.controller');
const tratamientosCtrl = require('../controllers/tratamientos.controller');
const odontologosCtrl = require('../controllers/odontologos.controller');
const usuariosCtrl = require('../controllers/usuarios.controller');

// ─── AUTH ───────────────────────────
router.post('/auth/login', authCtrl.login);
router.get('/auth/me', verifyToken, authCtrl.getMe);
// 🔥 NUEVO: Registro público de pacientes (Sin verifyToken porque cualquiera puede registrarse)
router.post('/auth/register-paciente', authCtrl.registerPaciente);

// 🛠️ RUTA DE EMERGENCIA: Forzar hash correcto para el admin (puedes borrarla después)
router.get('/auth/fix-admin', authCtrl.fixAdminPassword);

// ─── CITAS ──────────────────────────
router.get('/citas', verifyToken, citasCtrl.getAll);
router.get('/citas/stats', verifyToken, citasCtrl.getStats);
router.get('/citas/:id', verifyToken, citasCtrl.getOne);

router.post(
  '/citas',
  verifyToken,
  allowRoles('Administrador', 'Odontologo', 'Paciente'),
  citasCtrl.create
);

router.put(
  '/citas/:id',
  verifyToken,
  allowRoles('Administrador', 'Odontologo'),
  citasCtrl.update
);

router.delete(
  '/citas/:id',
  verifyToken,
  allowRoles('Administrador'),
  citasCtrl.remove
);

// 🔥 NUEVA RUTA: Guardar el reporte de evolución clínica de la cita
router.put(
  '/citas/:id/evolucion',
  verifyToken,
  allowRoles('Odontologo'), // Solo el odontólogo que atiende registra la evolución
  citasCtrl.updateEvolucion
);

// ─── PACIENTES ──────────────────────
router.get(
  '/pacientes',
  verifyToken,
  allowRoles('Administrador', 'Odontologo'),
  pacientesCtrl.getAll
);

// 🔥 NUEVA RUTA: Vincular usuario existente como paciente
router.post(
  '/pacientes/vincular',
  verifyToken,
  allowRoles('Administrador'),
  pacientesCtrl.vincularUsuario
);

router.get('/pacientes/:id', verifyToken, pacientesCtrl.getOne);

router.post(
  '/pacientes',
  verifyToken,
  allowRoles('Administrador'),
  pacientesCtrl.create
);

router.put(
  '/pacientes/:id',
  verifyToken,
  pacientesCtrl.update
);

// ─── HISTORIAL ──────────────────────
router.get(
  '/historial/:id_paciente',
  verifyToken,
  historialCtrl.getHistorialByPaciente
);

router.post(
  '/historial',
  verifyToken,
  allowRoles('Administrador', 'Odontologo'),
  historialCtrl.createHistorial
);

// ─── ASISTENCIA ─────────────────────
router.get(
  '/asistencia',
  verifyToken,
  allowRoles('Administrador', 'Odontologo'),
  asistenciaCtrl.getAsistencia
);

router.post(
  '/asistencia',
  verifyToken,
  allowRoles('Administrador', 'Odontologo'),
  asistenciaCtrl.registrarAsistencia
);

// ─── NOTIFICACIONES ─────────────────
router.get(
  '/notificaciones',
  verifyToken,
  notificacionesCtrl.getMisNotificaciones
);

router.put(
  '/notificaciones/:id/leer',
  verifyToken,
  notificacionesCtrl.marcarLeida
);

// ─── TRATAMIENTOS ───────────────────
router.get(
  '/tratamientos',
  verifyToken,
  tratamientosCtrl.getTratamientos
);

// ─── ODONTOLOGOS ────────────────────
router.get(
  '/odontologos',
  verifyToken,
  odontologosCtrl.getOdontologos
);

router.get(
  '/odontologos/perfil',
  verifyToken,
  allowRoles('Odontologo'),
  odontologosCtrl.getPerfil
);

// ─── USUARIOS ───────────────────────
router.get(
  '/usuarios',
  verifyToken,
  allowRoles('Administrador'),
  usuariosCtrl.getAllUsuarios
);

router.put(
  '/usuarios/:id/toggle',
  verifyToken,
  allowRoles('Administrador'),
  usuariosCtrl.toggleActivo
);

// 🔥 NUEVOS: Endpoints para que el Administrador gestione aprobaciones pendientes
router.get(
  '/usuarios/pendientes',
  verifyToken,
  allowRoles('Administrador'),
  usuariosCtrl.getPacientesPendientes
);

router.put(
  '/usuarios/:id/aprobar',
  verifyToken,
  allowRoles('Administrador'),
  usuariosCtrl.aprobarPaciente
);

module.exports = router;