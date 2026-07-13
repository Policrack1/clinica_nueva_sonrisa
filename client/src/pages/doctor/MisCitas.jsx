import { useState, useEffect } from 'react'
import { Search, FileText, X, Save, Download } from 'lucide-react'
import { PageHeader, StatusBadge, Spinner, EmptyState } from '../../components/ui/index'
import { fmtDate, getStatusLabel } from '../../utils/formatters'
import api from '../../utils/api'

const ESTADOS = ['programada','confirmada','en_curso','completada','cancelada']

export default function DoctorMisCitas() {
  const [citas,     setCitas]   = useState([])
  const [filtradas, setFilt]    = useState([])
  const [loading,   setLoading] = useState(true)
  const [query,     setQuery]   = useState('')
  const [estado,    setEstado]  = useState('todas')
  const [selCita,   setSelCita] = useState(null)

  // ── NUEVOS ESTADOS PARA EL REPORTE DE EVOLUCIÓN ──
  const [showEvolucionModal, setShowEvolucionModal] = useState(false)
  const [citaEvolucion, setCitaEvolucion]           = useState(null)
  const [evolucionTexto, setEvolucionTexto]         = useState('')
  const [isSaving, setIsSaving]                     = useState(false)

  useEffect(() => { load() }, [])
  useEffect(() => { filter() }, [citas, query, estado])

  async function load() {
    try {
      const { data } = await api.get('/citas')
      setCitas(data.data || [])
    } catch { } finally { setLoading(false) }
  }

  function filter() {
    let list = [...citas]
    if (query) {
      const q = query.toLowerCase()
      list = list.filter(c =>
        c.nombre_paciente?.toLowerCase().includes(q) ||
        c.nombre_tratamiento?.toLowerCase().includes(q)
      )
    }
    if (estado !== 'todas') list = list.filter(c => c.estado === estado)
    list.sort((a,b) => (b.fecha_cita+b.hora_cita).localeCompare(a.fecha_cita+a.hora_cita))
    setFilt(list)
  }

  async function cambiarEstado(id, newStatus) {
    try {
      await api.put(`/citas/${id}`, { estado: newStatus })
      await load()
      setSelCita(null)
    } catch { }
  }

  // ── MANEJADORES PARA EL REPORTE DE EVOLUCIÓN ──
  function abrirModalEvolucion(cita) {
    setCitaEvolucion(cita)
    setEvolucionTexto(cita.evolucion || '') // Si la base de datos ya trae la evolución
    setShowEvolucionModal(true)
  }

  async function handleSaveEvolucion(e) {
    e.preventDefault()
    setIsSaving(true)
    try {
      // Endpoint para actualizar la evolución de la cita
      await api.put(`/citas/${citaEvolucion.id_cita}/evolucion`, { 
        evolucion: evolucionTexto 
      })
      alert('Reporte de evolución guardado correctamente')
      setShowEvolucionModal(false)
      await load() // Recargar para actualizar los datos locales
    } catch (err) {
      alert('Error al guardar la evolución')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <div>
      <PageHeader title="Mis Citas" subtitle="Historial completo de tus citas" />

      <div className="card">
        {/* Barra */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 flex-wrap">
          <div className="search-wrap max-w-xs">
            <Search size={13} className="search-icon" />
            <input className="search-input" placeholder="Buscar paciente o tratamiento..."
              value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {['todas', ...ESTADOS].map(e => (
              <span key={e} className={`filter-pill ${estado===e?'active':''}`}
                onClick={() => setEstado(e)}>
                {e === 'todas' ? 'Todas' : getStatusLabel(e)}
              </span>
            ))}
          </div>
          <span className="ml-auto text-xs text-slate-400">{filtradas.length} resultado{filtradas.length!==1?'s':''}</span>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          {filtradas.length === 0
            ? <EmptyState icon="📅" title="Sin citas" desc="No hay citas con ese filtro" />
            : (
              <table className="data-table">
                <thead>
                  <tr><th>Fecha</th><th>Hora</th><th>Paciente</th><th>Tratamiento</th><th>Estado</th><th>Acción</th></tr>
                </thead>
                <tbody>
                  {filtradas.map(c => (
                    <tr key={c.id_cita} onClick={() => setSelCita(c)} className="cursor-pointer">
                      <td>{fmtDate(c.fecha_cita?.split('T')[0])}</td>
                      <td><span className="font-mono font-bold text-blue-600">{c.hora_cita?.slice(0,5)}</span></td>
                      <td>
                        <div>
                          <strong>{c.nombre_paciente}</strong>
                          {c.alergias && c.alergias !== 'Ninguna' && (
                            <span className="ml-1.5 text-[10px] text-red-600 font-bold">⚠️ {c.alergias}</span>
                          )}
                        </div>
                      </td>
                      <td>{c.nombre_tratamiento}</td>
                      <td><StatusBadge status={c.estado} /></td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1.5 items-center">
                          {c.estado === 'confirmada' && (
                            <button className="btn btn-xs bg-amber-100 text-amber-700 hover:bg-amber-200"
                              onClick={() => cambiarEstado(c.id_cita,'en_curso')}>▶ Iniciar</button>
                          )}
                          {c.estado === 'en_curso' && (
                            <button className="btn btn-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                              onClick={() => cambiarEstado(c.id_cita,'completada')}>✅ Completar</button>
                          )}
                          {c.estado === 'programada' && (
                            <button className="btn btn-xs bg-blue-100 text-blue-700 hover:bg-blue-200"
                              onClick={() => cambiarEstado(c.id_cita,'confirmada')}>Confirmar</button>
                          )}
                          
                          {/* ── BOTÓN DE EVOLUCIÓN (Solo si está Completada) ── */}
                          {c.estado === 'completada' && (
                            <button 
                              className="btn btn-xs bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center gap-1 font-bold"
                              onClick={() => abrirModalEvolucion(c)}
                            >
                              <FileText size={12} />
                              Evolución
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      </div>

      {/* ── Modal Detalle Existente ── */}
      {selCita && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50"
             onClick={() => setSelCita(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-7 w-[90%] max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <span className="font-sora font-bold text-lg">Cita #{selCita.id_cita}</span>
              <button onClick={() => setSelCita(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">✕</button>
            </div>
            {[
              ['Paciente',    selCita.nombre_paciente],
              ['Tratamiento', selCita.nombre_tratamiento],
              ['Fecha',       fmtDate(selCita.fecha_cita?.split('T')[0])],
              ['Hora',        selCita.hora_cita?.slice(0,5)],
              ['Duración',    `${selCita.duracion_min || 30} min`],
              ['Precio',      `S/ ${selCita.precio_base || '—'}`],
              ['Estado',      <StatusBadge key="s" status={selCita.estado} />],
            ].map(([k,v]) => (
              <div key={k} className="flex justify-between py-2.5 border-b border-slate-100 text-sm last:border-b-0">
                <span className="text-slate-500 font-medium">{k}</span>
                <span className="font-semibold">{v}</span>
              </div>
            ))}
            {selCita.notas && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-slate-600 border-l-2 border-blue-400">
                📝 {selCita.notas}
              </div>
            )}
            <div className="flex gap-2 mt-5 pt-4 border-t border-slate-100">
              {selCita.estado === 'confirmada' && (
                <button className="btn btn-primary flex-1 justify-center" onClick={() => cambiarEstado(selCita.id_cita,'en_curso')}>▶ Iniciar</button>
              )}
              {selCita.estado === 'en_curso' && (
                <button className="btn btn-success flex-1 justify-center" onClick={() => cambiarEstado(selCita.id_cita,'completada')}>✅ Completar</button>
              )}
              <button className="btn btn-secondary" onClick={() => setSelCita(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── NUEVO MODAL DE REPORTE DE EVOLUCIÓN ── */}
      {showEvolucionModal && citaEvolucion && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50"
             onClick={() => setShowEvolucionModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-[90%] max-w-lg" onClick={e => e.stopPropagation()}>
            
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-sora font-bold text-lg text-slate-800 flex items-center gap-2">
                  📄 Reporte Clínico de Evolución
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Paciente: <strong className="text-slate-700">{citaEvolucion.nombre_paciente}</strong> | Tratamiento: {citaEvolucion.nombre_tratamiento}
                </p>
              </div>
              <button onClick={() => setShowEvolucionModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">✕</button>
            </div>

            <form onSubmit={handleSaveEvolucion} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                  Notas de Progreso y Evolución
                </label>
                <textarea
                  className="w-full h-40 p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                  placeholder="Escribe aquí las observaciones clínicas, avances o indicaciones del tratamiento efectuado..."
                  value={evolucionTexto}
                  onChange={e => setEvolucionTexto(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4 mt-1">
                <button
                  type="button"
                  onClick={() => alert('Pronto: Descarga en PDF')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  <Download size={14} />
                  Descargar PDF
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEvolucionModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl shadow-md transition-all"
                  >
                    <Save size={14} />
                    {isSaving ? 'Guardando...' : 'Guardar Reporte'}
                  </button>
                </div>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  )
}