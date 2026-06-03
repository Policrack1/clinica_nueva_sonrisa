// src/pages/patient/Perfil.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { PageHeader, Avatar, Spinner } from '../../components/ui/index'
import { calcAge, fmtDate } from '../../utils/formatters'
import api from '../../utils/api'

export default function PatientPerfil() {
  const { user }  = useAuth()
  const [perfil,  setPerfil]  = useState(null)
  const [citas,   setCitas]   = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form,    setForm]    = useState({})
  const [saving,  setSaving]  = useState(false)
  const [msg,     setMsg]     = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const [pRes, cRes] = await Promise.all([
        api.get('/pacientes'),
        api.get('/citas'),
      ])
      const myPac = (pRes.data.data || []).find(p => p.email === user?.email)
      if (myPac) {
        setPerfil(myPac)
        setForm({
          telefono:        myPac.telefono || '',
          alergias:        myPac.alergias || 'Ninguna',
          direccion:       myPac.direccion || '',
          grupo_sanguineo: myPac.grupo_sanguineo || 'O+',
        })
      }
      setCitas(cRes.data.data || [])
    } catch { }
    finally { setLoading(false) }
  }

  async function handleSave() {
    if (!perfil) return
    setSaving(true)
    setMsg('')
    try {
      await api.put(`/pacientes/${perfil.id_paciente}`, form)
      await load()
      setEditing(false)
      setMsg('✅ Perfil actualizado correctamente')
      setTimeout(() => setMsg(''), 3000)
    } catch {
      setMsg('❌ Error al guardar los cambios')
    } finally {
      setSaving(false)
    }
  }

  const completadas = citas.filter(c => c.estado === 'completada')
  const proximas    = citas.filter(c => ['programada', 'confirmada'].includes(c.estado))

  if (loading) return <Spinner />

  return (
    <div>
      <PageHeader title="Mi Perfil" subtitle="Tu información personal y médica">
        {!editing
          ? (
            <button className="btn btn-secondary" onClick={() => setEditing(true)}>
              ✏️ Editar perfil
            </button>
          )
          : (
            <div className="flex gap-2">
              <button className="btn btn-secondary" onClick={() => { setEditing(false); setMsg('') }}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : '💾 Guardar cambios'}
              </button>
            </div>
          )}
      </PageHeader>

      {msg && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium
          ${msg.startsWith('✅') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                 : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg}
        </div>
      )}

      <div className="grid grid-cols-[1fr_1.4fr] gap-4">

        {/* ── Columna izquierda ── */}
        <div className="flex flex-col gap-4">

          {/* Avatar */}
          <div className="card">
            <div className="card-body flex flex-col items-center text-center py-8">
              <Avatar name={user?.nombre || ''} size={80} className="mb-4 text-2xl" />
              <h3 className="font-sora font-bold text-lg text-slate-800">{user?.nombre}</h3>
              <div className="text-sm text-slate-400 mt-1">{user?.email}</div>
              <div className="text-xs text-slate-400 mt-0.5">DNI: {perfil?.dni || '—'}</div>
              <div className="mt-3 flex gap-2 flex-wrap justify-center">
                <span className="badge badge-patient">Paciente activo</span>
                {perfil?.alergias && perfil.alergias !== 'Ninguna' && (
                  <span className="badge badge-cancelled">⚠️ {perfil.alergias}</span>
                )}
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">📊 Mi historial</span>
            </div>
            <div className="card-body">
              {[
                ['Total de citas',   citas.length],
                ['Completadas',      completadas.length],
                ['Próximas citas',   proximas.length],
                ['Última visita',    completadas.length > 0
                  ? fmtDate(completadas[completadas.length - 1]?.fecha_cita?.split('T')[0])
                  : '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2.5 border-b border-slate-100 text-sm last:border-b-0">
                  <span className="text-slate-500 font-medium">{k}</span>
                  <span className="font-bold text-slate-800">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Columna derecha ── */}
        <div className="flex flex-col gap-4">

          {/* Datos personales (solo lectura) */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">👤 Datos personales</span>
            </div>
            <div className="card-body">
              {[
                ['Nombre completo', user?.nombre],
                ['Email',           user?.email],
                ['DNI',             perfil?.dni],
                ['Edad',            perfil?.fecha_nacimiento
                  ? calcAge(perfil.fecha_nacimiento.split('T')[0]) + ' años'
                  : '—'],
                ['Fecha nacimiento', fmtDate(perfil?.fecha_nacimiento?.split('T')[0])],
                ['Género',           perfil?.genero === 'M' ? 'Masculino'
                                   : perfil?.genero === 'F' ? 'Femenino' : 'Otro'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2.5 border-b border-slate-100 text-sm last:border-b-0">
                  <span className="text-slate-500 font-medium">{k}</span>
                  <span className="font-semibold">{v || '—'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Datos médicos — editables */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">🏥 Datos médicos</span>
            </div>
            <div className="card-body">
              {editing
                ? (
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="form-label">Teléfono</label>
                      <input
                        className="form-control"
                        value={form.telefono}
                        onChange={e => setForm({ ...form, telefono: e.target.value })}
                        placeholder="9XX XXX XXX"
                      />
                    </div>
                    <div>
                      <label className="form-label">Grupo sanguíneo</label>
                      <select
                        className="form-control"
                        value={form.grupo_sanguineo}
                        onChange={e => setForm({ ...form, grupo_sanguineo: e.target.value })}
                      >
                        {['O+','O-','A+','A-','B+','B-','AB+','AB-'].map(g => (
                          <option key={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Alergias conocidas</label>
                      <input
                        className="form-control"
                        value={form.alergias}
                        onChange={e => setForm({ ...form, alergias: e.target.value })}
                        placeholder="Ninguna / especificar..."
                      />
                    </div>
                    <div>
                      <label className="form-label">Dirección</label>
                      <input
                        className="form-control"
                        value={form.direccion}
                        onChange={e => setForm({ ...form, direccion: e.target.value })}
                        placeholder="Av. Lima 123, Lima"
                      />
                    </div>
                  </div>
                )
                : (
                  <div>
                    {[
                      ['Teléfono',        perfil?.telefono || '—'],
                      ['Grupo sanguíneo', perfil?.grupo_sanguineo || '—'],
                      ['Alergias',        perfil?.alergias || 'Ninguna'],
                      ['Dirección',       perfil?.direccion || '—'],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between py-2.5 border-b border-slate-100 text-sm last:border-b-0">
                        <span className="text-slate-500 font-medium">{k}</span>
                        <span className={`font-semibold
                          ${k === 'Alergias' && v !== 'Ninguna' ? 'text-red-600' : ''}`}>
                          {k === 'Alergias' && v !== 'Ninguna' ? '⚠️ ' : ''}{v}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>

          {/* Contacto clínica */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
            <div className="font-bold text-blue-800 text-sm mb-3">📞 Contacto — Nueva Sonrisa</div>
            {[
              ['WhatsApp', '+51 987 654 321'],
              ['Email',    'citas@nuevasonrisa.pe'],
              ['Horario',  'Lun–Sáb · 8:00am – 6:00pm'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm py-1.5 border-b border-blue-100 last:border-b-0">
                <span className="text-blue-600 font-medium">{k}</span>
                <span className="font-semibold text-blue-800">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}