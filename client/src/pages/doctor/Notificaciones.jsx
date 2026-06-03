// ─── Doctor Notificaciones ────────────────────────────────
import { useState, useEffect } from 'react'
import { PageHeader, Spinner, EmptyState } from '../../components/ui/index'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import api from '../../utils/api'

const TYPE_ICON = { cita:'📅', recordatorio:'⏰', cancelacion:'❌', sistema:'⚙️' }
const TYPE_BG   = { cita:'bg-blue-100', recordatorio:'bg-amber-100', cancelacion:'bg-red-100', sistema:'bg-slate-100' }

export function DoctorNotificaciones() {
  const [notifs,  setNotifs]  = useState([])
  const [unread,  setUnread]  = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const { data } = await api.get('/notificaciones')
      setNotifs(data.data || [])
      setUnread(data.no_leidas || 0)
    } catch { } finally { setLoading(false) }
  }

  async function markOne(id) { await api.put(`/notificaciones/${id}/leer`); await load() }
  async function markAll()   { await api.put('/notificaciones/all/leer');   await load() }

  if (loading) return <Spinner />

  return (
    <div>
      <PageHeader title="Notificaciones" subtitle={`${unread} sin leer`}>
        {unread > 0 && <button className="btn btn-secondary" onClick={markAll}>✓ Marcar todas leídas</button>}
      </PageHeader>
      <div className="card">
        {notifs.length === 0
          ? <EmptyState icon="🔔" title="Sin notificaciones" />
          : notifs.map(n => (
            <div key={n.id_notificacion} className={`notif-item ${!n.leida?'unread':''}`}
              onClick={() => !n.leida && markOne(n.id_notificacion)}>
              <div className={`w-9 h-9 rounded-full ${TYPE_BG[n.tipo]||'bg-slate-100'} flex items-center justify-center text-base flex-shrink-0`}>
                {TYPE_ICON[n.tipo]||'🔔'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-800">{n.titulo}</div>
                <div className="text-xs text-slate-500 mt-0.5">{n.mensaje}</div>
                <div className="text-xs text-slate-400 mt-1">
                  {n.fecha_envio ? format(parseISO(n.fecha_envio),"d MMM yyyy · HH:mm",{locale:es}) : ''}
                </div>
              </div>
              {!n.leida && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />}
            </div>
          ))}
      </div>
    </div>
  )
}

export default DoctorNotificaciones


// ─── Doctor Perfil ────────────────────────────────────────
import { useAuth } from '../../context/AuthContext'
import { Avatar } from '../../components/ui/index'

export function DoctorPerfil() {
  const { user } = useAuth()
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadPerfil() }, [])

  async function loadPerfil() {
    try {
      const { data } = await api.get('/odontologos/perfil')
      setPerfil(data.data)
    } catch { } finally { setLoading(false) }
  }

  if (loading) return <Spinner />

  return (
    <div>
      <PageHeader title="Mi Perfil" subtitle="Información personal y profesional" />

      <div className="grid grid-cols-[1fr_1.4fr] gap-4">

        {/* Tarjeta perfil */}
        <div className="flex flex-col gap-4">
          <div className="card">
            <div className="card-body flex flex-col items-center text-center py-8">
              <Avatar name={user?.nombre || ''} size={80} className="mb-4 text-2xl" />
              <h3 className="font-sora font-bold text-lg text-slate-800">{user?.nombre}</h3>
              <div className="text-sm text-slate-400 mt-1">{user?.email}</div>
              <div className="mt-3 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                🩺 {perfil?.nombre_especialidad || 'Odontólogo'}
              </div>
              {perfil?.num_colegiatura && (
                <div className="text-xs text-slate-400 mt-2">Colegiatura: {perfil.num_colegiatura}</div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Estadísticas</span></div>
            <div className="card-body">
              {[
                ['Años de experiencia', `${perfil?.anios_experiencia || 0} años`],
                ['Especialidad', perfil?.nombre_especialidad || '—'],
                ['Teléfono', perfil?.telefono || '—'],
              ].map(([k,v]) => (
                <div key={k} className="flex justify-between py-2.5 border-b border-slate-100 text-sm last:border-b-0">
                  <span className="text-slate-500">{k}</span>
                  <span className="font-semibold">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Info + editar */}
        <div className="flex flex-col gap-4">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Información personal</span>
              <button className="btn btn-secondary btn-sm">✏️ Editar</button>
            </div>
            <div className="card-body">
              {[
                ['Nombre completo',  user?.nombre],
                ['Email',            user?.email],
                ['Rol',              user?.rol],
                ['Especialidad',     perfil?.nombre_especialidad || '—'],
                ['N° Colegiatura',   perfil?.num_colegiatura || '—'],
                ['Años experiencia', `${perfil?.anios_experiencia || 0} años`],
                ['Teléfono',         perfil?.telefono || '—'],
              ].map(([k,v]) => (
                <div key={k} className="flex justify-between py-2.5 border-b border-slate-100 text-sm last:border-b-0">
                  <span className="text-slate-500 font-medium">{k}</span>
                  <span className="font-semibold">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Especialidad</span></div>
            <div className="card-body">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-2xl">🦷</div>
                <div>
                  <div className="font-bold">{perfil?.nombre_especialidad || '—'}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{perfil?.esp_descripcion || ''}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}