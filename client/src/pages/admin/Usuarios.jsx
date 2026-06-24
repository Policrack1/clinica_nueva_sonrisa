import { useState, useEffect } from 'react'
import { Plus, Check, Clock } from 'lucide-react'
import { PageHeader, Modal, ModalFooter, Avatar, RoleBadge, Spinner, EmptyState } from '../../components/ui/index'
import api from '../../utils/api'

export default function AdminUsuarios() {
  const [users,      setUsers]      = useState([])
  const [pendientes, setPendientes] = useState([]) // 🔥 NUEVO: Almacena solicitudes en espera
  const [loading,    setLoading]    = useState(true)
  const [modalNew,   setModalNew]   = useState(false)
  const [form,       setForm]       = useState({ nombre:'', email:'', password:'', id_rol:3, especialidad:'' })
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    try {
      // 1. Cargar todos los usuarios generales
      const resGeneral = await api.get('/usuarios')
      setUsers(resGeneral.data.data || [])

      // 2. 🔥 NUEVO: Cargar los pacientes autoregistrados que están pendientes
      const resPendientes = await api.get('/usuarios/pendientes')
      setPendientes(resPendientes.data.data || [])
    } catch (err) {
      console.error("Error al cargar datos:", err)
    } finally { 
      setLoading(false) 
    }
  }

  // 🔥 NUEVA FUNCIÓN: Llamar al endpoint para dar de alta al paciente
  async function handleAprobar(id) {
    try {
      await api.put(`/usuarios/${id}/aprobar`)
      await load() // Recarga ambas tablas automáticamente
    } catch (err) {
      alert(err.response?.data?.message || 'Error al aprobar el paciente')
    }
  }

  async function toggleUser(id) {
    await api.put(`/usuarios/${id}/toggle`)
    await load()
  }

  async function handleCreate() {
    if (!form.nombre || !form.email || !form.password) { setError('Completa los campos requeridos'); return }
    setSaving(true); setError('')
    try {
      await api.post('/pacientes', { ...form })
      setModalNew(false)
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear usuario')
    } finally { setSaving(false) }
  }

  if (loading) return <Spinner />

  return (
    <div>
      <PageHeader title="Gestión de Usuarios" subtitle="RF8 — Roles y permisos del sistema">
        <button className="btn btn-primary" onClick={() => { setForm({ nombre:'',email:'',password:'',id_rol:3,especialidad:'' }); setError(''); setModalNew(true) }}>
          <Plus size={14}/> Nuevo Usuario
        </button>
      </PageHeader>

      {/* ── 🔥 NUEVA SECCIÓN: PANEL DE APROBACIONES PENDIENTES ── */}
      {pendientes.length > 0 && (
        <div className="card mb-6 border-l-4 border-amber-500 bg-amber-50/20">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2">
            <Clock size={16} className="text-amber-500 animate-pulse" />
            <h3 className="font-sora font-bold text-slate-800 text-sm">
              Solicitudes de Registro Pendientes ({pendientes.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr className="bg-amber-50/50">
                  <th>Paciente</th>
                  <th>Email</th>
                  <th>Fecha Solicitud</th>
                  <th className="text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {pendientes.map(p => (
                  <tr key={p.id_usuario} className="hover:bg-amber-50/30 transition-colors">
                    <td>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={p.nombre} size={30} />
                        <span className="font-semibold text-slate-700">{p.nombre}</span>
                      </div>
                    </td>
                    <td className="text-slate-500 text-xs">{p.email}</td>
                    <td className="text-slate-400 text-xs">{p.fecha_creacion?.split('T')[0]}</td>
                    <td className="text-right">
                      <button
                        onClick={() => handleAprobar(p.id_usuario)}
                        className="btn btn-success btn-xs inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1 px-2.5 rounded-lg transition-all shadow-sm"
                      >
                        <Check size={12} /> Aprobar Ingreso
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TABLA GENERAL DE USUARIOS ── */}
      <div className="card">
        <div className="overflow-x-auto">
          {users.length === 0
            ? <EmptyState icon="👤" title="Sin usuarios" />
            : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Fecha registro</th>
                    <th>Aprobación</th> {/* 🔥 Nueva columna informativa */}
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id_usuario}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <Avatar name={u.nombre} size={32} />
                          <strong>{u.nombre}</strong>
                        </div>
                      </td>
                      <td className="text-slate-400 text-xs">{u.email}</td>
                      <td><RoleBadge role={u.rol} /></td>
                      <td className="text-slate-400 text-xs">{u.fecha_creacion?.split('T')[0]}</td>
                      
                      {/* 🔥 Badge de estado de Aprobación */}
                      <td>
                        <span className={`badge ${u.estado === 'aprobado' ? 'badge-completed' : 'bg-amber-100 text-amber-700'}`}>
                          {u.estado === 'pendiente' ? '⏳ Pendiente' : '✓ Aprobado'}
                        </span>
                      </td>

                      <td>
                        <span className={`badge ${u.activo ? 'badge-completed' : 'badge-cancelled'}`}>
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        {u.id_usuario !== 1 && (
                          <button
                            className={`btn btn-xs ${u.activo ? 'btn-danger' : 'btn-success'}`}
                            onClick={() => toggleUser(u.id_usuario)}
                          >
                            {u.activo ? 'Desactivar' : 'Activar'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      </div>

      {/* MODAL NUEVO USUARIO */}
      <Modal open={modalNew} onClose={() => setModalNew(false)} title="🔐 Nuevo Usuario">
        <div className="modal-grid">
          <div>
            <label className="form-label">Nombre completo *</label>
            <input className="form-control" placeholder="Nombre Apellido" value={form.nombre} onChange={e => setForm({...form,nombre:e.target.value})} />
          </div>
          <div>
            <label className="form-label">Email *</label>
            <input className="form-control" type="email" placeholder="correo@sonrisa.com" value={form.email} onChange={e => setForm({...form,email:e.target.value})} />
          </div>
          <div>
            <label className="form-label">Contraseña *</label>
            <input className="form-control" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({...form,password:e.target.value})} />
          </div>
          <div>
            <label className="form-label">Rol</label>
            <select className="form-control" value={form.id_rol} onChange={e => setForm({...form,id_rol:parseInt(e.target.value)})}>
              <option value={1}>Administrador</option>
              <option value={2}>Odontólogo</option>
              <option value={3}>Paciente</option>
            </select>
          </div>
        </div>
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
        <ModalFooter onClose={() => setModalNew(false)} onConfirm={handleCreate} confirmLabel="✅ Crear Usuario" loading={saving} />
      </Modal>
    </div>
  )
}