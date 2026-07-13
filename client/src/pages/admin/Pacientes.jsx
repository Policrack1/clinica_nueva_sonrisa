import { useState, useEffect } from 'react'
import { Plus, Search } from 'lucide-react'
import { PageHeader, Modal, ModalFooter, Avatar, EmptyState, Spinner } from '../../components/ui/index'
import { fmtDate, calcAge } from '../../utils/formatters'
import api from '../../utils/api'

function emptyForm() {
  return {
    id_usuario: '', nombre: '', email: '', password: 'paciente123', dni: '', telefono: '',
    fecha_nacimiento: '', genero: 'M', grupo_sanguineo: 'O+', alergias: 'Ninguna', direccion: ''
  }
}

export function AdminPacientes() {
  const [pacientes, setPacientes] = useState([])
  const [filtrados, setFiltrados] = useState([])
  const [usuariosPendientes, setUsuariosPendientes] = useState([]) // 🔥 Nuevo
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [filt, setFilt] = useState('todos')
  const [modalNew, setModalNew] = useState(false)
  const [modalDet, setModalDet] = useState(false)
  const [selected, setSelected] = useState(null)
  const [historial, setHistorial] = useState([])
  const [citas, setCitas] = useState([])
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('info')

  useEffect(() => { load() }, [])
  useEffect(() => { filterList() }, [pacientes, query, filt])

  async function load() {
    setLoading(true)
    try {
      const { data } = await api.get('/pacientes')
      setPacientes(data.data || [])
    } catch { } finally { setLoading(false) }
  }

  // 🔥 Nueva función para cargar usuarios pendientes antes de abrir el modal
  async function abrirModalNuevo() {
    try {
      const { data } = await api.get('/usuarios/pendientes')
      setUsuariosPendientes(data.data || [])
    } catch (err) {
      console.error("No se pudieron cargar usuarios pendientes")
    }
    setForm(emptyForm())
    setError('')
    setModalNew(true)
  }

  function filterList() {
    let list = [...pacientes]
    if (query) {
      const q = query.toLowerCase()
      list = list.filter(p => p.nombre?.toLowerCase().includes(q) || p.dni?.includes(q))
    }
    if (filt === 'alg') list = list.filter(p => p.alergias && p.alergias !== 'Ninguna')
    setFiltrados(list)
  }

  async function openDet(p) {
    setSelected(p)
    setTab('info')
    setModalDet(true)
    try {
      const hist = await api.get(`/historial/${p.id_paciente}`)
      setHistorial(hist.data.data || [])
      const citasRes = await api.get('/citas')
      const citasPaciente = (citasRes.data.data || []).filter(c => c.id_paciente === p.id_paciente)
      setCitas(citasPaciente)
    } catch (err) {
      console.error(err)
      setHistorial([]); setCitas([])
    }
  }

  async function handleCreate() {
    if (!form.nombre || !form.dni || (!form.id_usuario && !form.email)) { 
      setError('Completa los campos requeridos'); return 
    }
    setSaving(true); setError('')
    try {
      if (form.id_usuario) {
        await api.post('/pacientes/vincular', form)
      } else {
        await api.post('/pacientes', form)
      }
      setModalNew(false); setForm(emptyForm()); await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Error al procesar')
    } finally { setSaving(false) }
  }
  if (loading) return <Spinner />

  return (
    <div>
      <PageHeader title="Pacientes" subtitle="RF4 — Registro y gestión de pacientes">
        <button className="btn btn-primary" onClick={() => { setForm(emptyForm()); setError(''); setModalNew(true) }}>
          <Plus size={14} /> Nuevo Paciente
        </button>
      </PageHeader>

      <div className="card">
        {/* Barra */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 flex-wrap">
          <div className="search-wrap max-w-xs">
            <Search size={13} className="search-icon" />
            <input className="search-input" placeholder="Nombre o DNI..." value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <div className="flex gap-1.5">
            {[['todos', 'Todos'], ['alg', 'Con alergias']].map(([v, l]) => (
              <span key={v} className={`filter-pill ${filt === v ? 'active' : ''}`} onClick={() => setFilt(v)}>{l}</span>
            ))}
          </div>
          <span className="ml-auto text-xs text-slate-400">{filtrados.length} paciente{filtrados.length !== 1 ? 's' : ''}</span>
        </div>

        

        {/* Grid tarjetas */}
        {filtrados.length === 0
          ? <EmptyState icon="👥" title="Sin pacientes" />
          : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-3 p-5">
              {filtrados.map(p => (
                <div key={p.id_paciente} className="patient-card" onClick={() => openDet(p)}>
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar name={p.nombre} size={42} />
                    <div>
                      <div className="font-bold text-sm text-slate-800">{p.nombre}</div>
                      <div className="text-xs text-slate-400">DNI: {p.dni}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">📱 {p.telefono || '—'}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">🩸 {p.grupo_sanguineo || '—'}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">📋 {p.total_citas || 0} citas</span>
                    {p.alergias && p.alergias !== 'Ninguna' && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-100 text-red-600">⚠️ {p.alergias}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
      <Modal open={modalNew} onClose={() => setModalNew(false)} title="👤 Registrar Nuevo Paciente" size="lg">
        
        {/* Sección de vinculación */}
        {usuariosPendientes.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <label className="form-label text-blue-800 font-bold">Vincular usuario registrado:</label>
            <select className="form-control" onChange={(e) => {
              const u = usuariosPendientes.find(x => x.id_usuario == e.target.value);
              if (u) {
                setForm({...form, id_usuario: u.id_usuario, nombre: u.nombre, email: u.email});
              } else {
                // Si vuelve a la opción vacía, resetea solo los campos vinculables
                setForm({...emptyForm(), password: form.password}); 
              }
            }}>
              <option value="">-- Seleccionar usuario para convertir en paciente --</option>
              {usuariosPendientes.map(u => <option key={u.id_usuario} value={u.id_usuario}>{u.nombre} ({u.email})</option>)}
            </select>
          </div>
        )}

        <div className="modal-grid">
          {[['nombre', 'Nombre completo *', 'text', 'Nombre Apellido'], ['email', 'Email *', 'email', 'correo@ejemplo.com'], ['password', 'Contraseña *', 'password', '••••••••'], ['dni', 'DNI *', 'text', '12345678'], ['telefono', 'Teléfono', 'tel', '9XX XXX XXX'], ['fecha_nacimiento', 'Fecha de nacimiento', 'date', ''], ['alergias', 'Alergias', 'text', 'Ninguna / especificar...'], ['direccion', 'Dirección', 'text', 'Av. Lima 123']].map(([k, l, t, ph]) => (
            <div key={k}>
              <label className="form-label">{l}</label>
              <input className="form-control" type={t} placeholder={ph} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} />
            </div>
          ))}
          <div>
            <label className="form-label">Género</label>
            <select className="form-control" value={form.genero} onChange={e => setForm({ ...form, genero: e.target.value })}>
              <option value="M">Masculino</option><option value="F">Femenino</option><option value="Otro">Otro</option>
            </select>
          </div>
          <div>
            <label className="form-label">Grupo sanguíneo</label>
            <select className="form-control" value={form.grupo_sanguineo} onChange={e => setForm({ ...form, grupo_sanguineo: e.target.value })}>
              {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
        </div>
        
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
        
        <ModalFooter onClose={() => setModalNew(false)} onConfirm={handleCreate} confirmLabel="✅ Registrar" loading={saving} />
      </Modal>
      {/* Modal Historial / Detalle */}
      <Modal open={modalDet} onClose={() => setModalDet(false)} title={selected?.nombre || ''} size="lg">
        {selected && (
          <>
            <div className="flex items-center gap-4 mb-5 p-4 bg-slate-50 rounded-xl">
              <Avatar name={selected.nombre} size={52} />
              <div>
                <div className="font-bold text-lg">{selected.nombre}</div>
                <div className="text-sm text-slate-400">{selected.email}</div>
                {selected.alergias && selected.alergias !== 'Ninguna' && (
                  <div className="text-xs text-red-600 font-semibold mt-1">⚠️ Alergia: {selected.alergias}</div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="tab-list mb-5">
              {[['info', '👤 Datos'], ['hx', '🏥 Historial'], ['citas', '📅 Próximas citas']].map(([t, l]) => (
                <span key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{l}</span>
              ))}
            </div>

            {tab === 'info' && (
              <div>
                {[['DNI', selected.dni], ['Teléfono', selected.telefono || '—'], ['Nacimiento', fmtDate(selected.fecha_nacimiento?.split('T')[0])], ['Edad', calcAge(selected.fecha_nacimiento?.split('T')[0]) + ' años'], ['Grupo sanguíneo', selected.grupo_sanguineo || '—'], ['Género', selected.genero === 'M' ? 'Masculino' : selected.genero === 'F' ? 'Femenino' : 'Otro'], ['Dirección', selected.direccion || '—'], ['Alergias', selected.alergias || 'Ninguna'], ['Total citas', selected.total_citas || 0]].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-2.5 border-b border-slate-100 text-sm last:border-b-0">
                    <span className="text-slate-500 font-medium">{k}</span>
                    <span className={`font-semibold ${k === 'Alergias' && v !== 'Ninguna' ? 'text-red-600' : ''}`}>{v}</span>
                  </div>
                ))}
              </div>
            )}

            {tab === 'hx' && (
              <div>
                {historial.length === 0
                  ? <EmptyState icon="🏥" title="Sin historial clínico" desc="No hay atenciones completadas aún" />
                  : historial.map(h => (
                    <div key={h.id_historial} className="border-b border-slate-100 last:border-b-0 py-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-bold text-sm">🦷 {h.nombre_tratamiento}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{fmtDate(h.fecha_cita?.split('T')[0])} · {h.nombre_odontologo}</div>
                        </div>
                      </div>
                      {h.diagnostico && (
                        <div className="text-sm text-slate-600 bg-blue-50 rounded-lg p-2.5 border-l-3 border-blue-400 mt-2">
                          {h.diagnostico}
                        </div>
                      )}
                      {h.medicamentos && h.medicamentos !== 'Ninguno' && (
                        <div className="text-xs text-slate-500 mt-1.5">💊 {h.medicamentos}</div>
                      )}
                    </div>
                  ))}
              </div>
            )}

            {tab === 'citas' && (
              <div>
                {citas.length === 0 ? (
                  <EmptyState
                    icon="📅"
                    title="Sin próximas citas"
                    desc="Este paciente no tiene citas registradas"
                  />
                ) : (
                  citas.map(c => (
                    <div
                      key={c.id_cita}
                      className="border-b border-slate-100 last:border-b-0 py-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-sm">
                            🦷 {c.nombre_tratamiento}
                          </div>

                          <div className="text-xs text-slate-400 mt-1">
                            {fmtDate(c.fecha_cita?.split('T')[0])} · {c.hora_cita}
                          </div>

                          <div className="text-xs mt-1">
                            👨‍⚕️ {c.nombre_odontologo}
                          </div>
                        </div>

                        <span className="text-[11px] px-2 py-1 rounded-full bg-blue-100 text-blue-600">
                          {c.estado}
                        </span>
                      </div>
                    </div>
                  ))
                )}
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

export default AdminPacientes


// ─── src/pages/admin/BuscarPacientes.jsx ─────────────────
export function AdminBuscar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [historial, setHistorial] = useState([])
  const [tab, setTab] = useState('info')
  const [modalDet, setModalDet] = useState(false)

  async function search(q) {
    setQuery(q)
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    try {
      const { data } = await api.get(`/pacientes?q=${encodeURIComponent(q)}`)
      setResults(data.data || [])
    } catch { } finally { setLoading(false) }
  }

  async function openDet(p) {
    setSelected(p); setTab('info'); setModalDet(true)
    try {
      const { data } = await api.get(`/historial/${p.id_paciente}`)
      setHistorial(data.data || [])
    } catch { setHistorial([]) }
  }

  return (
    <div>
      <PageHeader title="Buscar Pacientes" subtitle="RF5 — Búsqueda por nombre o DNI con historial clínico completo" />

      {/* Hero búsqueda */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6 mb-5 flex items-center gap-5">
        <div className="text-4xl">🔍</div>
        <div className="flex-1">
          <h3 className="font-bold text-blue-800 text-base">Búsqueda de Pacientes</h3>
          <p className="text-sm text-blue-600 mt-0.5">Ingresa nombre o DNI para acceder al historial clínico completo</p>
        </div>
        <div className="relative w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
          <input
            className="w-full pl-9 pr-4 py-3 border-2 border-blue-200 rounded-xl text-sm bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            placeholder="Nombre completo o DNI..."
            value={query}
            onChange={e => search(e.target.value)}
          />
        </div>
      </div>

      {/* Resultados */}
      {loading && <Spinner />}
      {!loading && query && results.length === 0 && (
        <EmptyState icon="🔍" title={`Sin resultados para "${query}"`} desc="Intenta con otro nombre o DNI" />
      )}
      {!loading && results.length > 0 && (
        <>
          <p className="text-xs text-slate-400 mb-3">Se encontraron <strong>{results.length}</strong> resultado(s)</p>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-3">
            {results.map(p => (
              <div key={p.id_paciente} className="patient-card">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar name={p.nombre} size={42} />
                  <div>
                    <div className="font-bold text-sm">{p.nombre}</div>
                    <div className="text-xs text-slate-400">DNI: {p.dni}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">📱 {p.telefono || '—'}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">🩸 {p.grupo_sanguineo || '—'}</span>
                  {p.alergias && p.alergias !== 'Ninguna' && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-100 text-red-600">⚠️ {p.alergias}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-primary btn-sm flex-1 justify-center" onClick={() => openDet(p)}>🏥 Ver historial</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {!query && (
        <div className="text-center py-16 text-slate-400">
          <div className="text-5xl mb-3">🔍</div>
          <div className="font-semibold text-slate-500">Escribe para buscar un paciente</div>
          <div className="text-sm mt-1">Búsqueda en tiempo real por nombre o DNI</div>
        </div>
      )}

      {/* Modal detalle */}
      <Modal open={modalDet} onClose={() => setModalDet(false)} title={selected?.nombre || ''} size="lg">
        {selected && (
          <>
            <div className="flex items-center gap-4 mb-5 p-4 bg-slate-50 rounded-xl">
              <Avatar name={selected.nombre} size={52} />
              <div>
                <div className="font-bold text-lg">{selected.nombre}</div>
                <div className="text-sm text-slate-400">{selected.email} · DNI: {selected.dni}</div>
              </div>
            </div>
            <div className="tab-list mb-5">
              {[['info', '👤 Datos'], ['hx', '🏥 Historial']].map(([t, l]) => (
                <span key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{l}</span>
              ))}
            </div>
            {tab === 'info' && (
              <div>
                {[['DNI', selected.dni], ['Teléfono', selected.telefono || '—'], ['Grupo sanguíneo', selected.grupo_sanguineo || '—'], ['Alergias', selected.alergias || 'Ninguna'], ['Dirección', selected.direccion || '—']].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-2.5 border-b border-slate-100 text-sm last:border-b-0">
                    <span className="text-slate-500 font-medium">{k}</span>
                    <span className={`font-semibold ${k === 'Alergias' && v !== 'Ninguna' ? 'text-red-600' : ''}`}>{v}</span>
                  </div>
                ))}
              </div>
            )}
            {tab === 'hx' && (
              historial.length === 0
                ? <EmptyState icon="🏥" title="Sin historial" />
                : historial.map(h => (
                  <div key={h.id_historial} className="border-b border-slate-100 last:border-b-0 py-3">
                    <div className="font-bold text-sm">🦷 {h.nombre_tratamiento}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{fmtDate(h.fecha_cita?.split('T')[0])} · {h.nombre_odontologo}</div>
                    {h.diagnostico && <div className="text-sm text-slate-600 bg-blue-50 rounded p-2 mt-2">{h.diagnostico}</div>}
                  </div>
                ))
            )}
          </>
        )}
        <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setModalDet(false)}>Cerrar</button></div>
      </Modal>
    </div>
  )
}