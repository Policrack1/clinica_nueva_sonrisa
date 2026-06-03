import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
         PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts'
import { PageHeader, StatCard, Spinner } from '../../components/ui/index'
import api from '../../utils/api'

const WEEK = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']
const TREATS = [
  { name:'Limpieza dental', value:12 },{ name:'Ortodoncia', value:8 },
  { name:'Endodoncia', value:5 },{ name:'Extracción', value:4 },
  { name:'Blanqueamiento', value:3 },{ name:'Radiografía', value:3 },
]
const MONTH_DATA = [
  { mes:'Ene',citas:18 },{ mes:'Feb',citas:22 },{ mes:'Mar',citas:19 },{ mes:'Abr',citas:25 }
]
const PIE_DATA = [
  { name:'Asistió', value:28, color:'#10b981' },
  { name:'No asistió', value:4, color:'#ef4444' },
  { name:'Cancelado', value:3, color:'#f59e0b' },
]
const COLORS = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4']

export default function AdminReportes() {
  const [stats, setStats]  = useState(null)
  const [weekData, setWD]  = useState([])
  const [loading, setLoad] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const { data } = await api.get('/citas/stats')
      setStats(data.data)
    } catch { } finally { setLoad(false) }
    setWD(WEEK.map((d,i) => ({ dia:d, citas:[4,6,5,7,4,2,0][i] })))
  }

  const total = PIE_DATA.reduce((s,d) => s + d.value, 0)
  const pct   = v => ((v/total)*100).toFixed(0)

  if (loading) return <Spinner />

  return (
    <div>
      <PageHeader title="Reportes y Estadísticas" subtitle="RF7 — Indicadores de gestión de la clínica">
        <button className="btn btn-primary" onClick={() => window.print()}>⬇ Exportar PDF</button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3.5 mb-5">
        <StatCard icon="✅" value="28" label="Citas atendidas (mes)" color="bg-emerald-100" />
        <StatCard icon="❌" value="4"  label="Inasistencias (mes)"   color="bg-red-100" />
        <StatCard icon="📊" value="88%" label="Tasa de asistencia"   color="bg-blue-100" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Citas por día */}
        <div className="card">
          <div className="card-header"><span className="card-title">Citas por día — Esta semana</span></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weekData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="dia" tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} width={20} />
                <Tooltip contentStyle={{ background:'#0f172a', border:'none', borderRadius:8, color:'#fff', fontSize:12 }} cursor={{ fill:'#f8fafc' }} />
                <Bar dataKey="citas" fill="#3b82f6" radius={[4,4,0,0]}
                     label={{ position:'top', fontSize:11, fill:'#475569', fontWeight:700 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Asistencia pie */}
        <div className="card">
          <div className="card-header"><span className="card-title">Distribución de asistencia</span></div>
          <div className="card-body flex items-center gap-4">
            <ResponsiveContainer width="50%" height={160}>
              <PieChart>
                <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                  {PIE_DATA.map((e,i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v,n) => [`${v} citas (${pct(v)}%)`, n]} contentStyle={{ background:'#0f172a',border:'none',borderRadius:8,color:'#fff',fontSize:12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2">
              {PIE_DATA.map(d => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background:d.color }} />
                  <span className="text-slate-600 font-medium">{d.name}</span>
                  <span className="font-bold text-slate-800 ml-auto pl-2">{pct(d.value)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Tratamientos */}
        <div className="card">
          <div className="card-header"><span className="card-title">Tratamientos más frecuentes</span></div>
          <div className="card-body">
            {TREATS.map((t,i) => (
              <div key={t.name} className="flex items-center gap-3 mb-2.5 last:mb-0">
                <div className="text-xs text-slate-500 w-28 flex-shrink-0 font-medium">{t.name}</div>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                       style={{ width:`${(t.value/12)*100}%`, background: COLORS[i] }} />
                </div>
                <div className="text-xs font-bold w-4 text-right">{t.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Citas mensuales */}
        <div className="card">
          <div className="card-header"><span className="card-title">Citas por mes — 2026</span></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={MONTH_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} width={25} />
                <Tooltip contentStyle={{ background:'#0f172a',border:'none',borderRadius:8,color:'#fff',fontSize:12 }} />
                <Line type="monotone" dataKey="citas" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill:'#3b82f6',r:4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}