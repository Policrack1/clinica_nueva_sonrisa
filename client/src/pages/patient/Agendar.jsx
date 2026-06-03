// src/pages/patient/Agendar.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { PageHeader, Spinner } from '../../components/ui/index'
import api from '../../utils/api'

export default function PatientAgendar() {
  const { user }       = useAuth()
  const navigate       = useNavigate()
  const [doctores,     setDoctores]     = useState([])
  const [tratamientos, setTratamientos] = useState([])
  const [form,         setForm]         = useState({
    id_odontologo: '', id_tratamiento: '',
    fecha_cita: '', hora_cita: '09:00', notas: ''
  })
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')
  const [success,    setSuccess]    = useState(false)
  const [loadingData,setLoadingData] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const [dRes, tRes] = await Promise.all([
        api.get('/odontologos'),
        api.get('/tratamientos'),
      ])
      setDoctores(dRes.data.data || [])
      setTratamientos(tRes.data.data || [])
    } catch { }
    finally { setLoadingData(false) }
  }

  async function handleAgendar(e) {
    e.preventDefault()
    if (!form.id_odontologo || !form.id_tratamiento || !form.fecha_cita) {
      setError('Por favor completa todos los campos requeridos')
      return
    }
    setSaving(true)
    setError('')
    try {
      // Obtener id_paciente del usuario actual
      const pRes  = await api.get('/pacientes')
      const myPac = (pRes.data.data || []).find(p => p.email === user?.email)
      if (!myPac) {
        setError('No se encontró tu perfil de paciente')
        setSaving(false)
        return
      }
      await api.post('/citas', {
        id_paciente:    myPac.id_paciente,
        id_odontologo:  parseInt(form.id_odontologo),
        id_tratamiento: parseInt(form.id_tratamiento),
        fecha_cita:     form.fecha_cita,
        hora_cita:      form.hora_cita,
        notas:          form.notas,
      })
      setSuccess(true)
      setTimeout(() => navigate('/paciente/citas'), 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Error al agendar la cita')
    } finally {
      setSaving(false)
    }
  }

  if (loadingData) return <Spinner />

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <div className="text-6xl">🎉</div>
        <h2 className="font-sora font-bold text-2xl text-slate-800">¡Cita solicitada!</h2>
        <p className="text-slate-500">
          Tu cita ha sido registrada correctamente.<br />
          Te contactaremos para confirmación.
        </p>
        <button className="btn btn-primary mt-2" onClick={() => navigate('/paciente/citas')}>
          Ver mis citas
        </button>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Agendar Cita" subtitle="Solicita una nueva cita con tu odontólogo" />

      <div className="grid grid-cols-[1.4fr_1fr] gap-4">

        {/* ── Formulario ── */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">📋 Datos de la cita</span>
          </div>
          <div className="card-body">
            <form onSubmit={handleAgendar} className="flex flex-col gap-4">

              <div>
                <label className="form-label">Odontólogo *</label>
                <select
                  className="form-control"
                  value={form.id_odontologo}
                  onChange={e => setForm({ ...form, id_odontologo: e.target.value })}
                  required
                >
                  <option value="">Seleccionar odontólogo...</option>
                  {doctores.map(d => (
                    <option key={d.id_odontologo} value={d.id_odontologo}>
                      {d.nombre} — {d.nombre_especialidad}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Tipo de tratamiento *</label>
                <select
                  className="form-control"
                  value={form.id_tratamiento}
                  onChange={e => setForm({ ...form, id_tratamiento: e.target.value })}
                  required
                >
                  <option value="">Seleccionar tratamiento...</option>
                  {tratamientos.map(t => (
                    <option key={t.id_tratamiento} value={t.id_tratamiento}>
                      {t.nombre_tratamiento} — S/ {t.precio_base} ({t.duracion_min} min)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Fecha *</label>
                  <input
                    className="form-control"
                    type="date"
                    value={form.fecha_cita}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setForm({ ...form, fecha_cita: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Hora preferida</label>
                  <select
                    className="form-control"
                    value={form.hora_cita}
                    onChange={e => setForm({ ...form, hora_cita: e.target.value })}
                  >
                    {['08:00','09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00'].map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Motivo / observaciones</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Describe brevemente el motivo de tu consulta..."
                  value={form.notas}
                  onChange={e => setForm({ ...form, notas: e.target.value })}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                  ❌ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary w-full justify-center py-3 text-base
                           disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? 'Solicitando...' : '📅 Solicitar Cita'}
              </button>
            </form>
          </div>
        </div>

        {/* ── Info lateral ── */}
        <div className="flex flex-col gap-4">
          <div className="card">
            <div className="card-header">
              <span className="card-title">ℹ️ Información importante</span>
            </div>
            <div className="card-body p-0">
              {[
                { icon:'⏰', t:'Horario de atención', d:'Lunes a Sábado · 8:00am – 6:00pm' },
                { icon:'📲', t:'Confirmación',         d:'Recibirás confirmación en máximo 24 horas.' },
                { icon:'❌', t:'Política de cancelación', d:'Cancela con al menos 24h de anticipación.' },
                { icon:'💊', t:'Alergias',              d:'Siempre informa sobre alergias medicamentosas.' },
              ].map(i => (
                <div key={i.t} className="flex items-start gap-3 px-5 py-3.5 border-b border-slate-100 last:border-b-0">
                  <span className="text-xl flex-shrink-0">{i.icon}</span>
                  <div>
                    <div className="text-sm font-semibold text-slate-700">{i.t}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{i.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">📞 Contacto directo</span>
            </div>
            <div className="card-body">
              {[
                ['WhatsApp',  '+51 987 654 321'],
                ['Email',     'citas@nuevasonrisa.pe'],
                ['Dirección', 'Jr. Los Álamos 245, Lima'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2.5 border-b border-slate-100 text-sm last:border-b-0">
                  <span className="text-slate-500 font-medium">{k}</span>
                  <span className="font-semibold text-blue-600">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}