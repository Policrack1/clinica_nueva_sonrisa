import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PageHeader, StatusBadge, Spinner, EmptyState } from '../../components/ui/index'
import { fmtDate, getStatusLabel } from '../../utils/formatters'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, isSameMonth, isToday, parseISO, addMonths,
  subMonths, addWeeks, subWeeks, addDays, subDays, getDay
} from 'date-fns'
import { es } from 'date-fns/locale'
import api from '../../utils/api'

const DOT_COLOR = {
  programada: 'bg-violet-400', confirmada: 'bg-blue-500',
  en_curso: 'bg-amber-400', completada: 'bg-emerald-400', cancelada: 'bg-red-400'
}
const VIEWS = ['Mes', 'Semana', 'Día']
const WEEK_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export default function AdminAgenda() {
  const [citas, setCitas] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('Mes')
  const [current, setCurrent] = useState(new Date(Date.now()))
  const [docFilt, setDocFilt] = useState('todos')
  const [doctores, setDoctores] = useState([])
  const [selCita, setSelCita] = useState(null)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    try {
      const [cRes, dRes] = await Promise.all([
        api.get('/citas'),
        api.get('/odontologos'),
      ])
      setCitas(cRes.data.data || [])
      setDoctores(dRes.data.data || [])
    } catch { }
    finally { setLoading(false) }
  }

  function filtered() {
    if (docFilt === 'todos') return citas
    return citas.filter(c => String(c.id_odontologo) === docFilt)
  }

  function citasForDay(dateStr) {
    return filtered().filter(c => c.fecha_cita?.startsWith(dateStr))
      .sort((a, b) => (a.hora_cita || '').localeCompare(b.hora_cita || ''))
  }

  function nav(dir) {
    if (view === 'Mes') setCurrent(v => dir > 0 ? addMonths(v, 1) : subMonths(v, 1))
    if (view === 'Semana') setCurrent(v => dir > 0 ? addWeeks(v, 1) : subWeeks(v, 1))
    if (view === 'Día') setCurrent(v => dir > 0 ? addDays(v, 1) : subDays(v, 1))
  }

  function headerLabel() {
    if (view === 'Mes') return format(current, 'MMMM yyyy', { locale: es })
    if (view === 'Semana') {
      const mon = startOfWeek(current, { weekStartsOn: 1 })
      const sun = endOfWeek(current, { weekStartsOn: 1 })
      return `${format(mon, "d MMM", { locale: es })} — ${format(sun, "d MMM yyyy", { locale: es })}`
    }
    return format(current, "EEEE d 'de' MMMM yyyy", { locale: es })
  }

  if (loading) return <Spinner />

  return (
    <div>
      <PageHeader title="Agenda Digital" subtitle="RF2 — Vista de citas por día, semana y mes" />

      <div className="card">
        {/* Nav bar */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 flex-wrap">

          <button
            onClick={() => nav(-1)}
            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            <ChevronLeft size={15} />
          </button>

          <span className="font-sora font-bold text-slate-800 capitalize text-[15px]">
            {headerLabel()}
          </span>

          <button
            onClick={() => nav(1)}
            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            <ChevronRight size={15} />
          </button>

          {/* NUEVO BOTÓN */}
          <button
            onClick={() => setCurrent(new Date())}
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            Hoy
          </button>

          {/* Vista tabs */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg ml-2">
            {VIEWS.map(v => (
              <span key={v} className={`tab-btn ${view === v ? 'active' : ''}`} onClick={() => setView(v)}>{v}</span>
            ))}
          </div>

          {/* Filtro doctor */}
          <div className="flex gap-1.5 ml-auto flex-wrap">
            <span className={`filter-pill ${docFilt === 'todos' ? 'active' : ''}`} onClick={() => setDocFilt('todos')}>Todos</span>
            {doctores.map(d => (
              <span key={d.id_odontologo} className={`filter-pill ${docFilt === String(d.id_odontologo) ? 'active' : ''}`}
                onClick={() => setDocFilt(String(d.id_odontologo))}>
                {d.nombre.replace('Dra. ', '').replace('Dr. ', '').split(' ')[0]}
              </span>
            ))}
          </div>
        </div>

        {/* ── VISTA MES ── */}
        {view === 'Mes' && <MonthView current={current} citasForDay={citasForDay} onCitaClick={setSelCita} onDayClick={d => { setCurrent(d); setView('Día') }} />}

        {/* ── VISTA SEMANA ── */}
        {view === 'Semana' && <WeekView current={current} citasForDay={citasForDay} onCitaClick={setSelCita} onDayClick={d => { setCurrent(d); setView('Día') }} />}

        {/* ── VISTA DÍA ── */}
        {view === 'Día' && <DayView current={current} citasForDay={citasForDay} onCitaClick={setSelCita} />}
      </div>

      {/* Panel detalle cita */}
      {selCita && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setSelCita(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-7 w-[90%] max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <span className="font-sora font-bold text-lg">Cita #{selCita.id_cita}</span>
              <button onClick={() => setSelCita(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200">✕</button>
            </div>
            {[
              ['Paciente', selCita.nombre_paciente],
              ['Odontólogo', selCita.nombre_odontologo],
              ['Fecha', fmtDate(selCita.fecha_cita?.split('T')[0])],
              ['Hora', selCita.hora_cita?.slice(0, 5)],
              ['Tratamiento', selCita.nombre_tratamiento],
              ['Estado', <StatusBadge key="s" status={selCita.estado} />],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2.5 border-b border-slate-100 text-sm last:border-b-0">
                <span className="text-slate-500 font-medium">{k}</span>
                <span className="font-semibold">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Sub-vistas ── */
function MonthView({ current, citasForDay, onCitaClick, onDayClick }) {
  const start = startOfWeek(startOfMonth(current), { weekStartsOn: 1 })
  const end = endOfWeek(endOfMonth(current), { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start, end })

  return (
    <div>
      {/* Cabecera días */}
      <div className="grid grid-cols-7 border-b border-slate-100">
        {WEEK_DAYS.map(d => (
          <div key={d} className="py-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wide">{d}</div>
        ))}
      </div>
      {/* Grilla */}
      <div className="grid grid-cols-7">
        {days.map(day => {
          const ds = format(day, 'yyyy-MM-dd')
          const dayCitas = citasForDay(ds)
          const inMonth = isSameMonth(day, current)
          const today = isToday(day)
          return (
            <div
              key={ds}
              onClick={() => onDayClick(day)}
              className={`min-h-[80px] p-1.5 border-r border-b border-slate-100 last:border-r-0 cursor-pointer transition-colors
                ${!inMonth ? 'bg-slate-50/50 opacity-40' : 'hover:bg-slate-50'}
                ${today ? 'bg-blue-50' : ''}`}
            >
              <div className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full
                ${today ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>
                {format(day, 'd')}
              </div>
              <div className="flex flex-col gap-0.5">
                {dayCitas.slice(0, 3).map(c => (
                  <div
                    key={c.id_cita}
                    onClick={e => { e.stopPropagation(); onCitaClick(c) }}
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium truncate cursor-pointer
                      ${{
                        confirmada: 'bg-blue-100 text-blue-700',
                        programada: 'bg-violet-100 text-violet-700',
                        en_curso: 'bg-amber-100 text-amber-700',
                        completada: 'bg-emerald-100 text-emerald-700',
                        cancelada: 'bg-red-100 text-red-700',
                      }[c.estado] || 'bg-slate-100 text-slate-500'}`}
                  >
                    {c.hora_cita?.slice(0, 5)} {c.nombre_paciente?.split(' ')[0]}
                  </div>
                ))}
                {dayCitas.length > 3 && (
                  <div className="text-[10px] text-blue-600 font-semibold px-1">+{dayCitas.length - 3} más</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WeekView({ current, citasForDay, onCitaClick, onDayClick }) {
  const mon = startOfWeek(current, { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(mon, i))

  return (
    <div>
      <div className="grid grid-cols-7 border-b border-slate-100">
        {days.map(day => {
          const today = isToday(day)
          return (
            <div key={day} onClick={() => onDayClick(day)}
              className={`py-3 text-center cursor-pointer hover:bg-slate-50 transition-colors border-r border-slate-100 last:border-r-0 ${today ? 'bg-blue-50' : ''}`}>
              <div className="text-xs text-slate-400 uppercase font-bold">
                {format(day, 'EEE', { locale: es })}
              </div>
              <div className={`font-sora text-lg font-bold mt-1 ${today ? 'text-blue-600' : 'text-slate-800'}`}>
                {format(day, 'd')}
              </div>
              <div className="text-xs text-blue-500 font-semibold mt-0.5">
                {citasForDay(format(day, 'yyyy-MM-dd')).length > 0
                  ? `${citasForDay(format(day, 'yyyy-MM-dd')).length} cita${citasForDay(format(day, 'yyyy-MM-dd')).length > 1 ? 's' : ''}`
                  : ''}
              </div>
            </div>
          )
        })}
      </div>
      <div className="grid grid-cols-7 min-h-[200px]">
        {days.map(day => {
          const ds = format(day, 'yyyy-MM-dd')
          return (
            <div key={ds} className="p-2 border-r border-slate-100 last:border-r-0">
              {citasForDay(ds).map(c => (
                <div key={c.id_cita} onClick={() => onCitaClick(c)}
                  className={`text-[10px] px-1.5 py-1 rounded mb-1 font-medium truncate cursor-pointer
                    ${{ confirmada: 'bg-blue-100 text-blue-700', programada: 'bg-violet-100 text-violet-700', en_curso: 'bg-amber-100 text-amber-700', completada: 'bg-emerald-100 text-emerald-700', cancelada: 'bg-red-100 text-red-700' }[c.estado] || 'bg-slate-100'}`}>
                  {c.hora_cita?.slice(0, 5)} {c.nombre_paciente?.split(' ')[0]}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DayView({ current, citasForDay, onCitaClick }) {
  const ds = format(current, 'yyyy-MM-dd')
  const citas = citasForDay(ds)

  return (
    <div className="p-5">
      <div className="font-bold text-slate-700 mb-4">
        📅 {format(current, "EEEE d 'de' MMMM yyyy", { locale: es })} — {citas.length} cita{citas.length !== 1 ? 's' : ''}
      </div>
      {citas.length === 0
        ? <EmptyState icon="📭" title="Sin citas este día" />
        : (
          <div className="flex flex-col">
            {citas.map((c, i) => (
              <div key={c.id_cita} className="tl-item">
                <div className="text-xs font-mono font-bold text-slate-400 w-11 text-right pt-3 flex-shrink-0">
                  {c.hora_cita?.slice(0, 5)}
                </div>
                <div className={`tl-dot ${c.estado === 'en_curso' ? 'active' : c.estado === 'completada' ? 'done' : ''}`} />
                <div className={`tl-card ${c.estado === 'en_curso' ? 'active-card' : ''}`} onClick={() => onCitaClick(c)}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-sm text-slate-800">{c.nombre_paciente}</div>
                      <div className="text-xs text-slate-400 mt-0.5">🦷 {c.nombre_tratamiento}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{c.nombre_odontologo}</div>
                    </div>
                    <StatusBadge status={c.estado} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}