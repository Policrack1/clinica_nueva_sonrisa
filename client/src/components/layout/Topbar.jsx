import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Bell } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function Topbar({ unread = 0 }) {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const today     = format(new Date(), "EEE d MMM yyyy", { locale: es })

  const notifRoute = {
    Administrador: '/admin/notificaciones',
    Odontologo:    '/doctor/notificaciones',
    Paciente:      '/paciente/notificaciones',
  }[user?.rol] || '/'

  return (
    <header className="h-14 bg-white border-b border-slate-100 flex items-center
                       px-6 gap-3 sticky top-0 z-40 shadow-sm flex-shrink-0">

      <span className="text-sm text-slate-500">
        Hola, <strong className="text-slate-800 font-bold">{user?.nombre}</strong>
      </span>

      <div className="ml-auto flex items-center gap-2">
        {/* Fecha actual */}
        <div className="text-xs text-slate-500 px-3 py-1.5 bg-slate-50 rounded-lg
                        flex items-center gap-1.5 capitalize">
          📅 {today}
        </div>

        {/* Notificaciones */}
        <button
          onClick={() => navigate(notifRoute)}
          className="relative w-9 h-9 rounded-lg bg-slate-50 flex items-center
                     justify-center text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <Bell size={17} />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500
                             rounded-full border-2 border-white" />
          )}
        </button>
      </div>
    </header>
  )
}