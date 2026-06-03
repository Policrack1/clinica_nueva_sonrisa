// Mejora para demostración de merge
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Users, CheckCircle, Clock, Plus, Search, BarChart3, Bell } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { PageHeader, StatCard, EmptyState, Spinner, StatusBadge } from '../../components/ui/index'
import { fmtDate, getStatusDot } from '../../utils/formatters'
import api from '../../utils/api'

const WEEK_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [hoy, setHoy] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    try {

      const today = new Date().toISOString().split('T')[0]

      const [sRes, cRes] = await Promise.all([
        api.get('/citas/stats'),
        api.get(`/citas?fecha=${today}`),
      ])

      setStats(sRes.data.data)
      setHoy(cRes.data.data || [])

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }
  // Datos simulados del gráfico semanal
  const weekData = WEEK_LABELS.map((d, i) => ({
    dia: d, citas: [4, 6, 5, 7, 4, 2, 0][i]
  }))

  if (loading) return <Spinner />

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Resumen general — Vista administrativa" />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3.5 mb-5">
        <StatCard icon="📅" value={stats?.citas_hoy} label="Citas Hoy" color="bg-blue-100" change="2 vs ayer" changeUp />
        <StatCard icon="👥" value={stats?.total_pacientes} label="Pacientes Registrados" color="bg-emerald-100" change="1 nuevo" changeUp />
        <StatCard icon="✅" value={stats?.completadas_hoy} label="Completadas Hoy" color="bg-amber-100" change="Sem: 5" changeUp />
        <StatCard icon="⏳" value={stats?.pendientes_hoy} label="Pendientes" color="bg-violet-100" change="1 cancelada" changeUp={false} />
      </div>

      <div className="grid grid-cols-[1.6fr_1fr] gap-4">

        {/* Citas de hoy */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Citas de Hoy</span>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin/citas')}>
              Ver todas →
            </button>
          </div>
          <div className="card-body p-0">
            {hoy.length === 0
              ? <EmptyState icon="📭" title="Sin citas hoy" />
              : hoy.slice(0, 6).map(c => (
                <div
                  key={c.id_cita}
                  className="flex items-center gap-3 px-5 py-3 border-b border-slate-100
                             last:border-b-0 hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => navigate('/admin/citas')}
                >
                  <span className="font-mono text-sm font-bold text-blue-600 w-12 flex-shrink-0">
                    {c.hora_cita?.slice(0, 5)}
                  </span>
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusDot(c.estado)}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-800 truncate">{c.nombre_paciente}</div>
                    <div className="text-xs text-slate-400 truncate">{c.nombre_tratamiento}</div>
                  </div>
                  <StatusBadge status={c.estado} />
                </div>
              ))
            }
          </div>
        </div>

        {/* Columna derecha */}
        <div className="flex flex-col gap-4">

          {/* Acciones rápidas */}
          <div className="card">
            <div className="card-header"><span className="card-title">Acciones Rápidas</span></div>
            <div className="card-body">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: <Plus size={18} />, label: 'Nueva Cita', to: '/admin/citas', color: 'bg-blue-50 text-blue-600 border-blue-100' },
                  { icon: <Users size={18} />, label: 'Nuevo Paciente', to: '/admin/pacientes', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
                  { icon: <BarChart3 size={18} />, label: 'Reportes', to: '/admin/reportes', color: 'bg-violet-50 text-violet-600 border-violet-100' },
                  { icon: <Bell size={18} />, label: 'Notificaciones', to: '/admin/notificaciones', color: 'bg-amber-50 text-amber-600 border-amber-100' },
                ].map(a => (
                  <button
                    key={a.label}
                    onClick={() => navigate(a.to)}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-sm
                                font-semibold transition-all hover:-translate-y-0.5
                                hover:shadow-sm ${a.color}`}
                  >
                    {a.icon} {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Gráfico semanal */}
          <div className="card flex-1">
            <div className="card-header">
              <span className="card-title">Citas para la semana actual</span>
              <span className="text-xs text-slate-400">Lun–Dom</span>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={weekData} barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="dia" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={20} />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }}
                    cursor={{ fill: '#f1f5f9' }}
                  />
                  <Bar dataKey="citas" fill="#3b82f6" radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: 11, fill: '#475569', fontWeight: 700 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}