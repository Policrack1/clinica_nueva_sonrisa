import { useState, useEffect } from 'react'
import { Plus, Search } from 'lucide-react'
import { PageHeader, Modal, ModalFooter, StatusBadge, EmptyState, Spinner } from '../../components/ui/index'
import { fmtDate, getStatusLabel } from '../../utils/formatters'
import api from '../../utils/api'

const ESTADOS = ['programada','confirmada','en_curso','completada','cancelada']
const TRATAMIENTOS_DEFAULT = ['Limpieza dental','Ortodoncia - Control','Endodoncia','Extracción simple','Blanqueamiento','Corona dental','Radiografía','Revisión general']

function emptyForm() {
  return { id_paciente:'', id_odontologo:'', id_tratamiento:'', fecha_cita:'', hora_cita:'', notas:'' }
}

export default function AdminCitas() {
  const [citas,      setCitas]      = useState([])
  const [filtradas,  setFiltradas]  = useState([])
  const [pacientes,  setPacientes]  = useState([])
  const [doctores,   setDoctores]   = useState([])
  const [tratamientos,setTrat]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [filtroEst,  setFiltroEst]  = useState('todas')
  const [query,      setQuery]      = useState('')
  const [modalNew,   setModalNew]   = useState(false)
  const [modalEdit,  setModalEdit]  = useState(false)
  const [modalDet,   setModalDet]   = useState(false)
  const [selected,   setSelected]   = useState(null)
  const [form,       setForm]       = useState(emptyForm())
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')

  useEffect(() => { loadAll() }, [])
  useEffect(() => { filter() }, [citas, filtroEst, query])

  async function loadAll() {
  try {
    const [cRes, pRes, dRes, tRes] = await Promise.all([
      api.get('/citas'),
      api.get('/pacientes'),
      api.get('/odontologos'),
      api.get('/tratamientos'),
    ])

    console.log('CITAS:', cRes.data)
    console.log('PACIENTES:', pRes.data)
    console.log('DOCTORES:', dRes.data)
    console.log('TRATAMIENTOS:', tRes.data)

    setCitas(cRes.data.data || [])
    setPacientes(pRes.data.data || [])
    setDoctores(dRes.data.data || [])
    setTrat(tRes.data.data || [])

  } catch (err) {
    console.log('ERROR COMPLETO:', err)
    console.log('RESPUESTA ERROR:', err.response)

  } finally {
    setLoading(false)
  }
}

  function filter() {
    let list = [...citas]
    if (filtroEst !== 'todas') list = list.filter(c => c.estado === filtroEst)
    if (query) {
      const q = query.toLowerCase()
      list = list.filter(c =>
        c.nombre_paciente?.toLowerCase().includes(q) ||
        c.nombre_tratamiento?.toLowerCase().includes(q) ||
        c.nombre_odontologo?.toLowerCase().includes(q)
      )
    }
    setFiltradas(list)
  }

  function openNew() { setForm(emptyForm()); setError(''); setModalNew(true) }
  function openEdit(c) {
    setSelected(c)
    setForm({
      id_paciente:   c.id_paciente,
      id_odontologo: c.id_odontologo,
      id_tratamiento:c.id_tratamiento,
      fecha_cita:    c.fecha_cita?.split('T')[0] || '',
      hora_cita:     c.hora_cita?.slice(0,5) || '',
      estado:        c.estado,
      notas:         c.notas || '',
    })
    setError('')
    setModalEdit(true)
  }
  function openDet(c) { setSelected(c); setModalDet(true) }

  async function handleCreate() {
    if (!form.id_paciente || !form.fecha_cita || !form.hora_cita) {
      setError('Completa los campos requeridos'); return
    }
    setSaving(true); setError('')
    try {
      await api.post('/citas', form)
      setModalNew(false); await loadAll()
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear cita')
    } finally { setSaving(false) }
  }

  async function handleUpdate() {
    setSaving(true); setError('')
    try {
      await api.put(`/citas/${selected.id_cita}`, form)
      setModalEdit(false); await loadAll()
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar')
    } finally { setSaving(false) }
  }

  async function handleCancel(id) {
    if (!confirm('¿Cancelar esta cita?')) return
    await api.put(`/citas/${id}`, { estado: 'cancelada' })
    await loadAll()
  }

  if (loading) return <Spinner />

  return (
    <div>
      <PageHeader title="Gestión de Citas" subtitle="RF1 — Registrar, modificar y cancelar citas">
        <button className="btn btn-primary" onClick={openNew}><Plus size={14}/> Nueva Cita</button>
      </PageHeader>

      <div className="card">
        {/* Barra búsqueda + filtros */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 flex-wrap">
          <div className="search-wrap max-w-xs">
            <Search size={13} className="search-icon" />
            <input className="search-input" placeholder="Buscar paciente o tratamiento..."
              value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {['todas', ...ESTADOS].map(e => (
              <span key={e} className={`filter-pill ${filtroEst === e ? 'active' : ''}`}
                onClick={() => setFiltroEst(e)}>
                {e === 'todas' ? 'Todas' : getStatusLabel(e)}
              </span>
            ))}
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          {filtradas.length === 0
            ? <EmptyState icon="📅" title="Sin citas" desc="No hay citas con ese filtro" />
            : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fecha</th><th>Hora</th><th>Paciente</th>
                    <th>Odontólogo</th><th>Tratamiento</th><th>Estado</th><th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map(c => (
                    <tr key={c.id_cita} onClick={() => openDet(c)}>
                      <td>{fmtDate(c.fecha_cita?.split('T')[0])}</td>
                      <td><span className="font-mono font-bold text-blue-600">{c.hora_cita?.slice(0,5)}</span></td>
                      <td><strong>{c.nombre_paciente}</strong></td>
                      <td className="text-slate-500 text-xs">{c.nombre_odontologo}</td>
                      <td>{c.nombre_tratamiento}</td>
                      <td><StatusBadge status={c.estado} /></td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1.5">
                          <button className="btn btn-secondary btn-xs" onClick={() => openEdit(c)}>✏️</button>
                          {c.estado === 'en_curso' &&
                            <button className="btn btn-xs bg-violet-100 text-violet-700 hover:bg-violet-200" onClick={() => openEdit(c)}>⚙️ Gestionar</button>}
                          {!['cancelada','completada'].includes(c.estado) &&
                            <button className="btn btn-danger btn-xs" onClick={() => handleCancel(c.id_cita)}>✕</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      </div>

      {/* Modal Nueva Cita */}
      <Modal open={modalNew} onClose={() => setModalNew(false)} title="📅 Agendar Nueva Cita">
        <div className="modal-grid">
          <div>
            <label className="form-label">Paciente *</label>
            <select className="form-control" value={form.id_paciente} onChange={e => setForm({...form, id_paciente: e.target.value})}>
              <option value="">Seleccionar...</option>
              {pacientes.map(p => <option key={p.id_paciente} value={p.id_paciente}>{p.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Odontólogo *</label>
            <select className="form-control" value={form.id_odontologo} onChange={e => setForm({...form, id_odontologo: e.target.value})}>
              <option value="">Seleccionar...</option>
              {doctores.map(d => <option key={d.id_odontologo} value={d.id_odontologo}>{d.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Fecha *</label>
            <input className="form-control" type="date" value={form.fecha_cita} onChange={e => setForm({...form, fecha_cita: e.target.value})} />
          </div>
          <div>
            <label className="form-label">Hora *</label>
            <input className="form-control" type="time" value={form.hora_cita} onChange={e => setForm({...form, hora_cita: e.target.value})} />
          </div>
        </div>
        <div className="mt-3">
          <label className="form-label">Tratamiento</label>
          <select className="form-control" value={form.id_tratamiento} onChange={e => setForm({...form, id_tratamiento: e.target.value})}>
            <option value="">Seleccionar...</option>
            {tratamientos.map(t => <option key={t.id_tratamiento} value={t.id_tratamiento}>{t.nombre_tratamiento}</option>)}
          </select>
        </div>
        <div className="mt-3">
          <label className="form-label">Notas</label>
          <input className="form-control" placeholder="Observaciones..." value={form.notas} onChange={e => setForm({...form, notas: e.target.value})} />
        </div>
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
        <ModalFooter onClose={() => setModalNew(false)} onConfirm={handleCreate} confirmLabel="✅ Agendar" loading={saving} />
      </Modal>

      {/* Modal Editar/Gestionar */}
      <Modal open={modalEdit} onClose={() => setModalEdit(false)} title="✏️ Editar Cita">
        <div className="modal-grid">
          <div>
            <label className="form-label">Paciente</label>
            <input className="form-control bg-slate-50" value={selected?.nombre_paciente || ''} readOnly />
          </div>
          <div>
            <label className="form-label">Estado</label>
            <select className="form-control" value={form.estado} onChange={e => setForm({...form, estado: e.target.value})}>
              {ESTADOS.map(e => <option key={e} value={e}>{getStatusLabel(e)}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Fecha</label>
            <input className="form-control" type="date" value={form.fecha_cita} onChange={e => setForm({...form, fecha_cita: e.target.value})} />
          </div>
          <div>
            <label className="form-label">Hora</label>
            <input className="form-control" type="time" value={form.hora_cita} onChange={e => setForm({...form, hora_cita: e.target.value})} />
          </div>
        </div>
        <div className="mt-3">
          <label className="form-label">Diagnóstico / Notas clínicas</label>
          <textarea className="form-control" rows={3} placeholder="Diagnóstico, medicamentos, observaciones..." value={form.notas} onChange={e => setForm({...form, notas: e.target.value})} />
        </div>
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
        <ModalFooter onClose={() => setModalEdit(false)} onConfirm={handleUpdate} confirmLabel="💾 Guardar" loading={saving} />
      </Modal>

      {/* Modal Detalle */}
      <Modal open={modalDet} onClose={() => setModalDet(false)} title={`Cita #${selected?.id_cita}`}>
        {selected && (
          <div>
            {[
              ['Paciente',    selected.nombre_paciente],
              ['Odontólogo',  selected.nombre_odontologo],
              ['Fecha',       fmtDate(selected.fecha_cita?.split('T')[0])],
              ['Hora',        selected.hora_cita?.slice(0,5)],
              ['Tratamiento', selected.nombre_tratamiento],
              ['Estado',      <StatusBadge key="s" status={selected.estado} />],
              ['Notas',       selected.notas || '—'],
            ].map(([k,v]) => (
              <div key={k} className="flex justify-between py-2.5 border-b border-slate-100 text-sm last:border-b-0">
                <span className="text-slate-500 font-medium">{k}</span>
                <span className="font-semibold text-right">{v}</span>
              </div>
            ))}
          </div>
        )}
        <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setModalDet(false)}>Cerrar</button></div>
      </Modal>
    </div>
  )
}