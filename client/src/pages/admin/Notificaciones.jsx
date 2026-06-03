import { useState, useEffect } from 'react'
import { PageHeader, Spinner, EmptyState } from '../../components/ui/index'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import api from '../../utils/api'

const TYPE_ICON = { cita:'📅', recordatorio:'⏰', cancelacion:'❌', sistema:'⚙️' }
const TYPE_BG   = { cita:'bg-blue-100', recordatorio:'bg-amber-100', cancelacion:'bg-red-100', sistema:'bg-slate-100' }

export default function AdminNotificaciones() {
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

  async function markOne(id) {
    await api.put(`/notificaciones/${id}/leer`)
    await load()
  }

  async function markAll() {
    await api.put('/notificaciones/all/leer')
    await load()
  }

  if (loading) return <Spinner />

  return (
    <div>
      <PageHeader title="Notificaciones" subtitle={`${unread} sin leer — Centro de avisos y recordatorios`}>
        {unread > 0 && (
          <button className="btn btn-secondary" onClick={markAll}>✓ Marcar todas leídas</button>
        )}
      </PageHeader>

      <div className="card">
        {notifs.length === 0
          ? <EmptyState icon="🔔" title="Sin notificaciones" />
          : notifs.map(n => (
            <div
              key={n.id_notificacion}
              className={`notif-item ${!n.leida ? 'unread' : ''}`}
              onClick={() => !n.leida && markOne(n.id_notificacion)}
            >
              <div className={`w-9 h-9 rounded-full ${TYPE_BG[n.tipo]||'bg-slate-100'} flex items-center justify-center text-base flex-shrink-0`}>
                {TYPE_ICON[n.tipo] || '🔔'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-800">{n.titulo}</div>
                <div className="text-xs text-slate-500 mt-0.5">{n.mensaje}</div>
                <div className="text-xs text-slate-400 mt-1">
                  {n.fecha_envio ? format(parseISO(n.fecha_envio), "d MMM yyyy · HH:mm", { locale: es }) : ''}
                </div>
              </div>
              {!n.leida && (
                <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
              )}
            </div>
          ))}
      </div>
    </div>
  )
}