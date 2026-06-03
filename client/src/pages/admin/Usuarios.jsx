import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { PageHeader, Modal, ModalFooter, Avatar, RoleBadge, Spinner, EmptyState } from '../../components/ui/index'
import api from '../../utils/api'

export default function AdminUsuarios() {
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modalNew,setModalNew]= useState(false)
  const [form,    setForm]    = useState({ nombre:'', email:'', password:'', id_rol:3, especialidad:'' })
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const { data } = await api.get('/usuarios')
      setUsers(data.data || [])
    } catch { } finally { setLoading(false) }
  }

  async function toggleUser(id) {
    await api.put(`/usuarios/${id}/toggle`)
    await load()
  }

  async function handleCreate() {
    if (!form.nombre || !form.email || !form.password) { setError('Completa los campos requeridos'); return }
    setSaving(true); setError('')
    try {
      // Crear usuario via endpoint de pacientes (simplificado)
      await api.post('/pacientes', { ...form })
      setModalNew(false)
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear usuario')
    } finally { setSaving(false) }
  }

  const ROL_LABEL = { 1:'Administrador', 2:'Odontologo', 3:'Paciente' }

  if (loading) return <Spinner />

  return (
    <div>
      <PageHeader title="Gestión de Usuarios" subtitle="RF8 — Roles y permisos del sistema">
        <button className="btn btn-primary" onClick={() => { setForm({ nombre:'',email:'',password:'',id_rol:3,especialidad:'' }); setError(''); setModalNew(true) }}>
          <Plus size={14}/> Nuevo Usuario
        </button>
      </PageHeader>

      <div className="card">
        <div className="overflow-x-auto">
          {users.length === 0
            ? <EmptyState icon="👤" title="Sin usuarios" />
            : (
              <table className="data-table">
                <thead>
                  <tr><th>Usuario</th><th>Email</th><th>Rol</th><th>Fecha registro</th><th>Estado</th><th>Acciones</th></tr>
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