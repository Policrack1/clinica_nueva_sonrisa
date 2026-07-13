import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { PageHeader, StatCard, StatusBadge, Spinner, EmptyState } from '../../components/ui/index'
import { fmtDate, fmtDateBox, getStatusDot } from '../../utils/formatters'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import api from '../../utils/api'

const WEEK = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export default function DoctorDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [citas, setCitas] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const [sRes, cRes] = await Promise.all([
        api.get('/citas/stats'),
        api.get('/citas'),
      ])
      setStats(sRes.data?.data || null)
      setCitas(cRes.data?.data || [])
    } catch (error) {
      console.error("Error cargando dashboard:", error)
    } finally {
      setLoading(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  const hoy = (citas || [])
    .filter(c => c && c.fecha_cita?.startsWith(today))
    .sort((a, b) => (a.hora_cita || '').localeCompare(b.hora_cita || ''))

  const proximas = (citas || [])
    .filter(c =>
      c &&
      c.fecha_cita >= today &&
      ['programada', 'confirmada'].includes(c.estado)
    )
    .sort((a, b) => (a.fecha_cita || '').localeCompare(b.fecha_cita || ''))
    .slice(0, 3)

  const weekData = WEEK.map((d, index) => {
    const targetDay = index + 1;
    const totalCitasDia = (citas || []).filter(c => {
      if (!c || !c.fecha_cita) return false;
      const fechaLimpia = c.fecha_cita.split('T')[0];
      const dateObj = new Date(fechaLimpia + 'T12:00:00');
      let day = dateObj.getDay();
      if (day === 0) day = 7;
      return day === targetDay && ['programada', 'confirmada', 'completada'].includes(c.estado);
    }).length;

    return { dia: d, citas: totalCitasDia };
  });

  if (loading) return <Spinner />

  return (
    <div>
      {/* Banner bienvenida */}
      <div className="relative overflow-hidden rounded-2xl mb-5 p-6"
        style={{ background: 'linear-gradient(135deg,#1e40af 0%,#0ea5e9 100%)' }}>
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-7xl opacity-15">🩺</div>
        <h2 className="font-sora text-xl font-bold text-white mb-1">
          Bienvenida, {user?.nombre} 👋
        </h2>
        <p className="text-blue-100 text-sm">
          Tienes <strong>{hoy.length}</strong> cita{hoy.length !== 1 ? 's' : ''} programada{hoy.length !== 1 ? 's' : ''} para hoy
        </p>
        <div className="flex gap-3 mt-4 flex-wrap">
          <button className="bg-white/20 border border-white/30 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-white/30 transition-colors backdrop-blur"
            onClick={() => navigate('/doctor/agenda')}>📅 Ver mi agenda</button>
          <button className="bg-white/20 border border-white/30 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-white/30 transition-colors backdrop-blur"
            onClick={() => navigate('/doctor/citas')}>📋 Mis citas</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3.5 mb-5">
        <StatCard icon="📅" value={hoy.length} label="Citas hoy" color="bg-blue-100" />
        <StatCard icon="✅" value={stats?.citas_semana || 0} label="Esta semana" color="bg-emerald-100" />
        <StatCard icon="👥" value={stats?.mis_pacientes || 0} label="Mis pacientes" color="bg-violet-100" />
      </div>

      <div className="grid grid-cols-[1.5fr_1fr] gap-4">
        {/* Agenda hoy */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Agenda de Hoy</span>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/doctor/agenda')}>
              Ver agenda completa →
            </button>
          </div>
          <div className="card-body p-0">
            {hoy.length === 0
              ? <EmptyState icon="📭" title="Sin citas hoy" desc="Disfruta tu día libre 🎉" />
              : hoy.map(c => (
                <div key={c.id_cita}
                  className="flex items-center gap-3 px-5 py-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => navigate('/doctor/citas')}
                >
                  <span className="font-mono text-sm font-bold text-blue-600 w-12 flex-shrink-0">
                    {c.hora_cita?.slice(0, 5)}
                  </span>
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusDot(c.estado)}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-slate-800 truncate">{c.nombre_paciente}</div>
                    <div className="text-xs text-slate-400 truncate">🦷 {c.nombre_tratamiento}</div>
                  </div>
                  <StatusBadge status={c.estado} />
                </div>
              ))
            }
          </div>
        </div>

        {/* Columna derecha */}
        <div className="flex flex-col gap-4">
          {/* Próxima cita */}
          <div className="card">
            <div className="card-header"><span className="card-title">🔜 Próxima cita</span></div>
            <div className="card-body">
              {proximas.length === 0
                ? <EmptyState icon="📅" title="Sin próximas citas" />
                : (() => {
                  const p = proximas[0]
                  const fb = fmtDateBox(p.fecha_cita?.split('T')[0])
                  return (
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-50 rounded-xl p-2.5 text-center min-w-[52px]">
                        <div className="font-sora text-xl font-bold text-blue-600">{fb.day}</div>
                        <div className="text-xs font-bold text-blue-500">{fb.month}</div>
                      </div>
                      <div>
                        <div className="font-bold text-sm">{p.nombre_paciente}</div>
                        <div className="text-xs text-slate-400 mt-0.5">🦷 {p.nombre_tratamiento}</div>
                        <div className="text-xs text-blue-600 font-semibold mt-0.5">⏰ {p.hora_cita?.slice(0, 5)}</div>
                        {p?.alergias && p.alergias !== 'Ninguna' && (
                          <div className="text-xs text-red-600 mt-1 font-semibold">⚠️ Alergia: {p.alergias}</div>
                        )}
                      </div>
                    </div>
                  )
                })()
              }
            </div>
          </div>

          {/* Gráfico semanal */}
          <div className="card flex-1">
            <div className="card-header"><span className="card-title">Mi semana</span></div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={weekData} barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="dia" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={18} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="citas" fill="#8b5cf6" radius={[4, 4, 0, 0]}
                    label={{ position: 'top', fontSize: 10, fill: '#475569', fontWeight: 700 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}