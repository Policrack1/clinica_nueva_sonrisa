import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { PageHeader, StatusBadge, Spinner, EmptyState } from '../../components/ui/index'
import { fmtDate, fmtDateBox, getStatusDot } from '../../utils/formatters'
import api from '../../utils/api'

export default function PatientDashboard() {
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const [citas,    setCitas]   = useState([])
  const [notifs,   setNotifs]  = useState([])
  const [loading,  setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const [cRes, nRes] = await Promise.all([
        api.get('/citas'),
        api.get('/notificaciones'),
      ])
      setCitas(cRes.data.data || [])
      setNotifs((nRes.data.data || []).slice(0, 3))
    } catch { } finally { setLoading(false) }
  }

  const proximas   = citas.filter(c => c.fecha_cita >= '2026-04-18' && ['programada','confirmada','en_curso'].includes(c.estado))
    .sort((a,b) => a.fecha_cita?.localeCompare(b.fecha_cita))
  const completadas = citas.filter(c => c.estado === 'completada')
  const canceladas  = citas.filter(c => c.estado === 'cancelada')

  if (loading) return <Spinner />

  return (
    <div>
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl mb-5 p-6"
           style={{ background:'linear-gradient(135deg,#1e40af 0%,#0ea5e9 100%)' }}>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-8xl opacity-10 select-none">🦷</div>
        <h2 className="font-sora text-xl font-bold text-white mb-1">
          ¡Hola, {user?.nombre?.split(' ')[0]}! 😊
        </h2>
        <p className="text-blue-100 text-sm mb-4">
          {proximas.length > 0
            ? `Tienes ${proximas.length} cita${proximas.length>1?'s':''} próxima${proximas.length>1?'s':''}`
            : 'No tienes citas próximas programadas'}
        </p>
        <div className="flex gap-3 flex-wrap">
          <button className="bg-white text-blue-700 text-sm font-bold px-4 py-2 rounded-xl hover:bg-blue-50 transition-colors shadow"
            onClick={() => navigate('/paciente/agendar')}>
            📅 Agendar cita
          </button>
          <button className="bg-white/20 border border-white/30 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-white/30 transition-colors backdrop-blur"
            onClick={() => navigate('/paciente/citas')}>
            📋 Mis citas
          </button>
          <button className="bg-white/20 border border-white/30 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-white/30 transition-colors backdrop-blur"
            onClick={() => navigate('/paciente/historial')}>
            🏥 Mi historial
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3.5 mb-5">
        <div className="stat-card">
          <div className="stat-icon bg-blue-100">📅</div>
          <div>
            <div className="stat-num">{citas.length}</div>
            <div className="stat-label">Total de citas</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-emerald-100">✅</div>
          <div>
            <div className="stat-num">{completadas.length}</div>
            <div className="stat-label">Completadas</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-amber-100">⏳</div>
          <div>
            <div className="stat-num">{proximas.length}</div>
            <div className="stat-label">Próximas</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[1.5fr_1fr] gap-4">

        {/* Próximas citas */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Mis próximas citas</span>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/paciente/citas')}>Ver todas →</button>
          </div>
          <div className="card-body p-0">
            {proximas.length === 0
              ? (
                <div className="flex flex-col items-center py-10 gap-3">
                  <div className="text-4xl">📭</div>
                  <div className="font-semibold text-slate-500">No tienes citas próximas</div>
                  <button className="btn btn-primary btn-sm" onClick={() => navigate('/paciente/agendar')}>
                    + Agendar cita
                  </button>
                </div>
              )
              : proximas.map(c => {
                const fb = fmtDateBox(c.fecha_cita?.split('T')[0])
                return (
                  <div key={c.id_cita}
                    className="flex items-center gap-4 px-5 py-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => navigate('/paciente/citas')}>
                    <div className="bg-blue-50 rounded-xl p-2 text-center min-w-[52px] flex-shrink-0">
                      <div className="font-sora text-xl font-bold text-blue-600 leading-none">{fb.day}</div>
                      <div className="text-[10px] font-bold text-blue-400 mt-0.5">{fb.month}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-slate-800">🦷 {c.nombre_tratamiento}</div>
                      <div className="text-xs text-slate-400 mt-0.5">⏰ {c.hora_cita?.slice(0,5)} · {c.nombre_odontologo}</div>
                    </div>
                    <StatusBadge status={c.estado} />
                  </div>
                )
              })
            }
          </div>
        </div>

        {/* Columna derecha */}
        <div className="flex flex-col gap-4">

          {/* Consejos de salud */}
          <div className="card">
            <div className="card-header"><span className="card-title">💡 Consejos de salud</span></div>
            <div className="card-body p-0">
              {[
                { n:'1', tip:'Cepíllate 3 veces al día', desc:'Usa técnica de Bass, 2 minutos.' },
                { n:'2', tip:'Hilo dental diario',        desc:'Antes de dormir, entre cada diente.' },
                { n:'3', tip:'Control cada 6 meses',      desc:'Revisión preventiva con tu odontólogo.' },
              ].map(t => (
                <div key={t.n} className="flex items-start gap-3 px-5 py-3 border-b border-slate-100 last:border-b-0">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{t.n}</div>
                  <div>
                    <div className="text-sm font-semibold text-slate-700">{t.tip}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{t.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notificaciones recientes */}
          <div className="card flex-1">
            <div className="card-header">
              <span className="card-title">🔔 Avisos recientes</span>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/paciente/notificaciones')}>Ver todos</button>
            </div>
            <div className="card-body p-0">
              {notifs.length === 0
                ? <div className="py-8 text-center text-slate-400 text-sm">Sin notificaciones</div>
                : notifs.map(n => (
                  <div key={n.id_notificacion} className={`flex items-start gap-3 px-5 py-3 border-b border-slate-100 last:border-b-0 ${!n.leida?'bg-blue-50':''}`}>
                    <span className="text-lg flex-shrink-0">
                      {{ cita:'📅', recordatorio:'⏰', cancelacion:'❌', sistema:'⚙️' }[n.tipo]||'🔔'}
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{n.titulo}</div>
                      <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">{n.mensaje}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}