import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { PageHeader, StatusBadge, Spinner, EmptyState } from '../../components/ui/index'
import { fmtDate, getStatusLabel } from '../../utils/formatters'
import api from '../../utils/api'

const ESTADOS = ['programada','confirmada','en_curso','completada','cancelada']

export default function DoctorMisCitas() {
  const [citas,    setCitas]   = useState([])
  const [filtradas,setFilt]    = useState([])
  const [loading,  setLoading] = useState(true)
  const [query,    setQuery]   = useState('')
  const [estado,   setEstado]  = useState('todas')
  const [selCita,  setSelCita] = useState(null)

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
                    <tr key={c.id_cita} onClick={() => setSelCita(c)}>
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
                        <div className="flex gap-1">
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
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      </div>

      {/* Modal detalle */}
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
    </div>
  )
}