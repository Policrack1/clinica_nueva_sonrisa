import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getInitials, getAvatarColor } from '../../utils/formatters'
import {
  LayoutDashboard, Calendar, CalendarDays, Users, Search,
  Bell, CheckSquare, BarChart3, UserCog, LogOut,
  Stethoscope, ClipboardList, User, BookOpen
} from 'lucide-react'

// Menú por rol
const MENUS = {
  Administrador: [
    { label: 'Principal',   section: true },
    { label: 'Dashboard',        icon: LayoutDashboard, to: '/admin' },
    { label: 'Gestión de Citas', icon: Calendar,        to: '/admin/citas' },
    { label: 'Agenda Digital',   icon: CalendarDays,    to: '/admin/agenda' },
    { label: 'Pacientes',  section: true },
    { label: 'Pacientes',        icon: Users,           to: '/admin/pacientes' },
    { label: 'Buscar Pacientes', icon: Search,          to: '/admin/buscar' },
    { label: 'Gestión',    section: true },
    { label: 'Notificaciones',   icon: Bell,            to: '/admin/notificaciones', badge: true },
    { label: 'Asistencia',       icon: CheckSquare,     to: '/admin/asistencia' },
    { label: 'Reportes',         icon: BarChart3,       to: '/admin/reportes' },
    { label: 'Usuarios',         icon: UserCog,         to: '/admin/usuarios' },
  ],
  Odontologo: [
    { label: 'Mi espacio',  section: true },
    { label: 'Dashboard',        icon: LayoutDashboard, to: '/doctor' },
    { label: 'Mi Agenda',        icon: CalendarDays,    to: '/doctor/agenda' },
    { label: 'Mis Citas',        icon: Calendar,        to: '/doctor/citas' },
    { label: 'Pacientes',  section: true },
    { label: 'Mis Pacientes',    icon: Users,           to: '/doctor/pacientes' },
    { label: 'Avisos',      section: true },
    { label: 'Notificaciones',   icon: Bell,            to: '/doctor/notificaciones', badge: true },
    { label: 'Mi Perfil',        icon: User,            to: '/doctor/perfil' },
  ],
  Paciente: [
    { label: 'Mi cuenta',   section: true },
    { label: 'Inicio',           icon: LayoutDashboard, to: '/paciente' },
    { label: 'Mis Citas',        icon: Calendar,        to: '/paciente/citas' },
    { label: 'Agendar Cita',     icon: CalendarDays,    to: '/paciente/agendar' },
    { label: 'Historial Clínico',icon: BookOpen,        to: '/paciente/historial' },
    { label: 'Más',         section: true },
    { label: 'Notificaciones',   icon: Bell,            to: '/paciente/notificaciones', badge: true },
    { label: 'Mi Perfil',        icon: User,            to: '/paciente/perfil' },
  ],
}

export default function Sidebar({ unread = 0 }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const menu = MENUS[user?.rol] || []

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-[240px] bg-sidebar flex flex-col fixed top-0 left-0 bottom-0 z-50
                      shadow-[2px_0_20px_rgba(0,0,0,0.15)] overflow-y-auto">

      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 py-[18px] border-b border-white/5 flex-shrink-0">
        <div className="w-8 h-8 rounded-[8px] bg-blue-600 flex items-center justify-center text-base flex-shrink-0">
          🦷
        </div>
        <span className="font-sora text-[15px] font-bold text-white">Nueva Sonrisa</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 overflow-y-auto">
        {menu.map((item, i) => {
          if (item.section) {
            return (
              <div key={i} className="text-[10px] font-bold uppercase tracking-[0.1em]
                                       text-slate-500/50 px-2.5 pt-3 pb-1 mt-1">
                {item.label}
              </div>
            )
          }
          const Icon = item.icon
          return (
            <NavLink
              key={i}
              to={item.to}
              end={item.to === '/admin' || item.to === '/doctor' || item.to === '/paciente'}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={16} className="flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge && unread > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold
                                 px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {unread}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-white/5 flex-shrink-0">
        <div className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-slate-800
                        transition-colors cursor-pointer mb-1">
          <div
            className="avatar w-9 h-9 text-sm"
            style={{ background: getAvatarColor(user?.nombre || '') }}
          >
            {getInitials(user?.nombre || '')}
          </div>
          <div>
            <div className="text-sm font-semibold text-white leading-tight">{user?.nombre}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{user?.rol}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg
                     text-slate-400 text-sm font-medium transition-colors
                     hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut size={14} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}