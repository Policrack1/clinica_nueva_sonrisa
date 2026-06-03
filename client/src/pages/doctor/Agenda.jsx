import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PageHeader, StatusBadge, Spinner, EmptyState } from '../../components/ui/index'
import { fmtDate } from '../../utils/formatters'
import { format, addDays, subDays, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import api from '../../utils/api'

export default function DoctorAgenda() {
   const [citas,   setCitas]   = useState([])
  const [loading, setLoading] = useState(true)

  // FECHA ACTUAL
  const [current, setCurrent] = useState(new Date())

  const [selCita, setSelCita] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const { data } = await api.get('/citas')
      setCitas(data.data || [])
    } catch { } finally { setLoading(false) }
  }

  const ds = format(current, 'yyyy-MM-dd')
  const dayCitas = citas
    .filter(c => c.fecha_cita?.startsWith(ds))
    .sort((a,b) => a.hora_cita?.localeCompare(b.hora_cita))

  const DOT_CLS = {
    programada:'', confirmada:'dc', en_curso:'active', completada:'done', cancelada:''
  }

  async function gestionar(cita, newStatus) {
    try {
      await api.put(`/citas/${cita.id_cita}`, { estado: newStatus })
      await load()
      setSelCita(null)
    } catch { }
  }

  if (loading) return <Spinner />

  return (
    <div>
      <PageHeader title="Mi Agenda" subtitle="Vista diaria de tus citas programadas" />

      <div className="card">
        {/* Nav */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 flex-wrap">
          <button onClick={() => setCurrent(v => subDays(v,1))}
            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:border-blue-400 hover:text-blue-600 transition-colors">
            <ChevronLeft size={15}/>
          </button>
          <span className="font-sora font-bold text-slate-800 capitalize text-[15px]">
            {format(current, "EEEE d 'de' MMMM yyyy", { locale: es })}
          </span>
          <button onClick={() => setCurrent(v => addDays(v,1))}
            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:border-blue-400 hover:text-blue-600 transition-colors">
            <ChevronRight size={15}/>
          </button>
          <span className="ml-auto text-xs text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg">
            {dayCitas.length} cita{dayCitas.length !== 1 ? 's' : ''} este día
          </span>
        </div>

        {/* Timeline */}
        <div className="p-5">
          {dayCitas.length === 0
            ? <EmptyState icon="📭" title="Sin citas este día" desc="Navega a otro día con las flechas" />
            : (
              <div className="flex flex-col">
                {dayCitas.map(c => (
                  <div key={c.id_cita} className="tl-item">
                    <div className="text-xs font-mono font-bold text-slate-400 w-11 text-right pt-3 flex-shrink-0">
                      {c.hora_cita?.slice(0,5)}
                    </div>
                    <div className={`tl-dot ${DOT_CLS[c.estado] || ''}`} />
                    <div
                      className={`tl-card ${c.estado === 'en_curso' ? 'active-card' : ''}`}
                      onClick={() => setSelCita(c)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-slate-800">{c.nombre_paciente}</div>
                          <div className="text-xs text-slate-400 mt-0.5">🦷 {c.nombre_tratamiento}</div>
                          {c.notas && (
                            <div className="text-xs text-slate-500 mt-1.5 bg-slate-50 rounded px-2 py-1 border-l-2 border-slate-300">
                              {c.notas}
                            </div>
                          )}
                          {/* Alergias del paciente */}
                          {c.alergias && c.alergias !== 'Ninguna' && (
                            <div className="text-xs text-red-600 font-semibold mt-1">⚠️ Alergia: {c.alergias}</div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <StatusBadge status={c.estado} />
                          {c.estado === 'confirmada' && (
                            <button className="btn btn-xs bg-amber-100 text-amber-700 hover:bg-amber-200"
                              onClick={e => { e.stopPropagation(); gestionar(c,'en_curso') }}>
                              ▶ Iniciar
                            </button>
                          )}
                          {c.estado === 'en_curso' && (
                            <button className="btn btn-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                              onClick={e => { e.stopPropagation(); gestionar(c,'completada') }}>
                              ✅ Completar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>

      {/* Modal detalle */}
      {selCita && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50"
             onClick={() => setSelCita(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-7 w-[90%] max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <span className="font-sora font-bold text-lg">Detalle de Cita</span>
              <button onClick={() => setSelCita(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200">✕</button>
            </div>
            {[
              ['Paciente',    selCita.nombre_paciente],
              ['Tratamiento', selCita.nombre_tratamiento],
              ['Fecha',       fmtDate(selCita.fecha_cita?.split('T')[0])],
              ['Hora',        selCita.hora_cita?.slice(0,5)],
              ['Estado',      <StatusBadge key="s" status={selCita.estado} />],
              ['Duración',    `${selCita.duracion_min || 30} min`],
            ].map(([k,v]) => (
              <div key={k} className="flex justify-between py-2.5 border-b border-slate-100 text-sm last:border-b-0">
                <span className="text-slate-500 font-medium">{k}</span>
                <span className="font-semibold">{v}</span>
              </div>
            ))}
            {selCita.notas && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-3 border-blue-400 text-sm text-slate-600">
                📝 {selCita.notas}
              </div>
            )}
            {/* Acciones */}
            <div className="flex gap-2 mt-5 pt-4 border-t border-slate-100">
              {selCita.estado === 'confirmada' && (
                <button className="btn btn-primary flex-1 justify-center" onClick={() => gestionar(selCita,'en_curso')}>▶ Iniciar consulta</button>
              )}
              {selCita.estado === 'en_curso' && (
                <button className="btn btn-success flex-1 justify-center" onClick={() => gestionar(selCita,'completada')}>✅ Marcar completada</button>
              )}
              <button className="btn btn-secondary" onClick={() => setSelCita(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}