import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// Layout
import AppLayout from './components/layout/AppLayout'

// Pages públicas
import LoginPage from './pages/LoginPage'

// Admin
import AdminDashboard    from './pages/admin/Dashboard'
import AdminCitas        from './pages/admin/Citas'
import AdminAgenda       from './pages/admin/Agenda'
import AdminPacientes    from './pages/admin/Pacientes'
import AdminBuscar       from './pages/admin/BuscarPacientes'
import AdminNotif        from './pages/admin/Notificaciones'
import AdminAsistencia   from './pages/admin/Asistencia'
import AdminReportes     from './pages/admin/Reportes'
import AdminUsuarios     from './pages/admin/Usuarios'

// Doctor
import DoctorDashboard   from './pages/doctor/Dashboard'
import DoctorAgenda      from './pages/doctor/Agenda'
import DoctorCitas       from './pages/doctor/MisCitas'
import DoctorPacientes   from './pages/doctor/MisPacientes'
import DoctorNotif       from './pages/doctor/Notificaciones'
import DoctorPerfil      from './pages/doctor/Perfil'

// Paciente
import PatientDashboard  from './pages/patient/Dashboard'
import PatientCitas      from './pages/patient/MisCitas'
import PatientAgendar    from './pages/patient/Agendar'
import PatientHistorial  from './pages/patient/Historial'
import PatientNotif      from './pages/patient/Notificaciones'
import PatientPerfil     from './pages/patient/Perfil'

// Guard: redirige si no hay sesión
function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen text-slate-400">Cargando...</div>
  if (!user)   return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.rol)) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const { user } = useAuth()

  // Redirigir según rol al entrar
  function defaultRoute() {
    if (!user) return '/login'
    if (user.rol === 'Administrador') return '/admin'
    if (user.rol === 'Odontologo')    return '/doctor'
    return '/paciente'
  }

  return (
    <BrowserRouter>
      <Routes>

        {/* Pública */}
        <Route path="/login" element={<LoginPage />} />

        {/* Redirección raíz */}
        <Route path="/" element={<Navigate to={defaultRoute()} replace />} />

        {/* ── ADMIN ── */}
        <Route path="/admin" element={
          <PrivateRoute roles={['Administrador']}>
            <AppLayout role="Administrador" />
          </PrivateRoute>
        }>
          <Route index                   element={<AdminDashboard />} />
          <Route path="citas"            element={<AdminCitas />} />
          <Route path="agenda"           element={<AdminAgenda />} />
          <Route path="pacientes"        element={<AdminPacientes />} />
          <Route path="buscar"           element={<AdminBuscar />} />
          <Route path="notificaciones"   element={<AdminNotif />} />
          <Route path="asistencia"       element={<AdminAsistencia />} />
          <Route path="reportes"         element={<AdminReportes />} />
          <Route path="usuarios"         element={<AdminUsuarios />} />
        </Route>

        {/* ── DOCTOR ── */}
        <Route path="/doctor" element={
          <PrivateRoute roles={['Odontologo']}>
            <AppLayout role="Odontologo" />
          </PrivateRoute>
        }>
          <Route index                   element={<DoctorDashboard />} />
          <Route path="agenda"           element={<DoctorAgenda />} />
          <Route path="citas"            element={<DoctorCitas />} />
          <Route path="pacientes"        element={<DoctorPacientes />} />
          <Route path="notificaciones"   element={<DoctorNotif />} />
          <Route path="perfil"           element={<DoctorPerfil />} />
        </Route>

        {/* ── PACIENTE ── */}
        <Route path="/paciente" element={
          <PrivateRoute roles={['Paciente']}>
            <AppLayout role="Paciente" />
          </PrivateRoute>
        }>
          <Route index                   element={<PatientDashboard />} />
          <Route path="citas"            element={<PatientCitas />} />
          <Route path="agendar"          element={<PatientAgendar />} />
          <Route path="historial"        element={<PatientHistorial />} />
          <Route path="notificaciones"   element={<PatientNotif />} />
          <Route path="perfil"           element={<PatientPerfil />} />
        </Route>

        {/* 404 → redirección */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  )
}

