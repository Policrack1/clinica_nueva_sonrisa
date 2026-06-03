import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { PageHeader, Avatar, Modal, Spinner, EmptyState } from '../../components/ui/index'
import { fmtDate, calcAge } from '../../utils/formatters'
import api from '../../utils/api'

export default function DoctorMisPacientes() {
  const [pacientes, setPacientes] = useState([])
  const [filtrados, setFiltrados] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [query,     setQuery]     = useState('')
  const [selected,  setSelected]  = useState(null)
  const [historial, setHistorial] = useState([])
  const [tab,       setTab]       = useState('info')
  const [modalDet,  setModalDet]  = useState(false)

  useEffect(() => { load() }, [])
  useEffect(() => { filter() }, [pacientes, query])

  async function load() {
    try {
      const { data } = await api.get('/pacientes')
      setPacientes(data.data || [])
    } catch { } finally { setLoading(false) }
  }

  function filter() {
    if (!query.trim()) { setFiltrados(pacientes); return }
    const q = query.toLowerCase()
    setFiltrados(pacientes.filter(p =>
      p.nombre?.toLowerCase().includes(q) || p.dni?.includes(q)
    ))
  }

  async function openDet(p) {
    setSelected(p); setTab('info'); setModalDet(true)
    try {
      const { data } = await api.get(`/historial/${p.id_paciente}`)
      setHistorial(data.data || [])
    } catch { setHistorial([]) }
  }

  if (loading) return <Spinner />

  return (
    <div>
      <PageHeader title="Mis Pacientes" subtitle="Pacientes que han tenido citas contigo" />

      <div className="card">
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100">
          <div className="search-wrap max-w-sm">
            <Search size={13} className="search-icon" />
            <input className="search-input" placeholder="Buscar por nombre o DNI..."
              value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <span className="ml-auto text-xs text-slate-400">{filtrados.length} paciente{filtrados.length!==1?'s':''}</span>
        </div>

        {filtrados.length === 0
          ? <EmptyState icon="👥" title="Sin pacientes" />
          : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-3 p-5">
              {filtrados.map(p => (
                <div key={p.id_paciente} className="patient-card" onClick={() => openDet(p)}>
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar name={p.nombre} size={44} />
                    <div>
                      <div className="font-bold text-sm">{p.nombre}</div>
                      <div className="text-xs text-slate-400">DNI: {p.dni}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">📱 {p.telefono||'—'}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">🩸 {p.grupo_sanguineo||'—'}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">📋 {p.total_citas||0} citas</span>
                    {p.alergias && p.alergias !== 'Ninguna' && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-semibold">⚠️ {p.alergias}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      {/* Modal historial */}
      <Modal open={modalDet} onClose={() => setModalDet(false)} title={selected?.nombre || ''} size="lg">
        {selected && (
          <>
            <div className="flex items-center gap-4 mb-5 p-4 bg-slate-50 rounded-xl">
              <Avatar name={selected.nombre} size={52} />
              <div>
                <div className="font-bold text-lg">{selected.nombre}</div>
                <div className="text-sm text-slate-400">{selected.email}</div>
                {selected.alergias && selected.alergias !== 'Ninguna' && (
                  <div className="text-xs text-red-600 font-bold mt-1 bg-red-50 px-2 py-0.5 rounded">⚠️ ALERGIA: {selected.alergias}</div>
                )}
              </div>
            </div>

            <div className="tab-list mb-5">
              {[['info','👤 Datos'],['hx','🏥 Historial clínico']].map(([t,l]) => (
                <span key={t} className={`tab-btn ${tab===t?'active':''}`} onClick={() => setTab(t)}>{l}</span>
              ))}
            </div>

            {tab === 'info' && (
              <div>
                {[
                  ['DNI',             selected.dni],
                  ['Teléfono',        selected.telefono||'—'],
                  ['Edad',            calcAge(selected.fecha_nacimiento?.split('T')[0])+' años'],
                  ['Fecha nacimiento', fmtDate(selected.fecha_nacimiento?.split('T')[0])],
                  ['Grupo sanguíneo', selected.grupo_sanguineo||'—'],
                  ['Género',          selected.genero==='M'?'Masculino':selected.genero==='F'?'Femenino':'Otro'],
                  ['Alergias',        selected.alergias||'Ninguna'],
                  ['Dirección',       selected.direccion||'—'],
                  ['Total citas',     selected.total_citas||0],
                ].map(([k,v]) => (
                  <div key={k} className="flex justify-between py-2.5 border-b border-slate-100 text-sm last:border-b-0">
                    <span className="text-slate-500 font-medium">{k}</span>
                    <span className={`font-semibold ${k==='Alergias'&&v!=='Ninguna'?'text-red-600':''}`}>{v}</span>
                  </div>
                ))}
              </div>
            )}

            {tab === 'hx' && (
              <div>
                {historial.length === 0
                  ? <EmptyState icon="🏥" title="Sin historial clínico" desc="No hay atenciones completadas" />
                  : historial.map(h => (
                    <div key={h.id_historial} className="py-4 border-b border-slate-100 last:border-b-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-bold text-sm">🦷 {h.nombre_tratamiento}</div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            📅 {fmtDate(h.fecha_cita?.split('T')[0])} · ⏰ {h.hora_cita?.slice(0,5)}
                          </div>
                        </div>
                      </div>
                      {h.diagnostico && (
                        <div className="text-sm text-slate-600 bg-blue-50 rounded-lg p-2.5 border-l-2 border-blue-400 mt-2">
                          📋 {h.diagnostico}
                        </div>
                      )}
                      {h.medicamentos && h.medicamentos !== 'Ninguno' && (
                        <div className="text-xs text-slate-500 mt-1.5">💊 {h.medicamentos}</div>
                      )}
                      {h.proxima_revision && (
                        <div className="text-xs text-emerald-600 font-semibold mt-1.5">
                          🔜 Próxima revisión: {fmtDate(h.proxima_revision?.split('T')[0])}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </>
        )}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setModalDet(false)}>Cerrar</button>
        </div>
      </Modal>
    </div>
  )
}