import { useState, useEffect } from 'react'
import { PageHeader, Spinner, EmptyState } from '../../components/ui/index'
import { fmtDate, getStatusLabel } from '../../utils/formatters'
import api from '../../utils/api'

const ATT_LABEL = { asistio:'✅ Asistió', no_asistio:'❌ No asistió', cancelado:'🚫 Cancelado' }
const ATT_CLS   = { asistio:'bg-emerald-100 text-emerald-700', no_asistio:'bg-red-100 text-red-700', cancelado:'bg-amber-100 text-amber-700' }
const PENDING   = 'bg-slate-100 text-slate-500'

export default function AdminAsistencia() {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filt,    setFilt]    = useState('all')

  useEffect(() => { load() }, [])

  async function load() {
    try {
      // Citas pasadas sin asistencia registrada + las que tienen asistencia
      const [cRes, aRes] = await Promise.all([
        api.get('/citas'),
        api.get('/asistencia'),
      ])
      const citas = cRes.data.data || []
      const asis  = aRes.data.data || []
      // Enriquecer citas con estado de asistencia
      const enriched = citas
        .filter(c => ['completada','confirmada','programada','en_curso','cancelada'].includes(c.estado))
        .map(c => {
          const att = asis.find(a => a.id_cita === c.id_cita)
          return { ...c, asistencia: att?.estado || null, obs: att?.observacion || '' }
        })
      setItems(enriched)
    } catch { } finally { setLoading(false) }
  }

  async function registrar(id_cita, estado) {
    try {
      await api.post('/asistencia', { id_cita, estado, observacion: '' })
      await load()
    } catch { }
  }

  const filtered = filt === 'all'
    ? items
    : filt === 'pending'
      ? items.filter(i => !i.asistencia)
      : items.filter(i => i.asistencia === filt)

  if (loading) return <Spinner />

  return (
    <div>
      <PageHeader title="Control de Asistencia" subtitle="RF6 — Registrar si el paciente asistió, no asistió o canceló" />

      <div className="card">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 flex-wrap">
          {[['all','Todas'],['pending','Pendientes'],['asistio','Asistió'],['no_asistio','No asistió'],['cancelado','Cancelado']].map(([v,l]) => (
            <span key={v} className={`filter-pill ${filt===v?'active':''}`} onClick={() => setFilt(v)}>{l}</span>
          ))}
        </div>

        <div className="overflow-x-auto">
          {filtered.length === 0
            ? <EmptyState icon="✅" title="Sin registros" />
            : (
              <table className="data-table">
                <thead>
                  <tr><th>Paciente</th><th>Fecha</th><th>Hora</th><th>Tratamiento</th><th>Odontólogo</th><th>Estado</th><th>Acción</th></tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id_cita}>
                      <td><strong>{c.nombre_paciente}</strong></td>
                      <td>{fmtDate(c.fecha_cita?.split('T')[0])}</td>
                      <td><span className="font-mono font-bold text-blue-600">{c.hora_cita?.slice(0,5)}</span></td>
                      <td>{c.nombre_tratamiento}</td>
                      <td className="text-slate-400 text-xs">{c.nombre_odontologo}</td>
                      <td>
                        {c.asistencia
                          ? <span className={`badge ${ATT_CLS[c.asistencia]||PENDING}`}>{ATT_LABEL[c.asistencia]}</span>
                          : <span className={`badge ${PENDING}`}>⏳ Pendiente</span>}
                      </td>
                      <td>
                        {!c.asistencia && !['cancelada'].includes(c.estado) && (
                          <div className="flex gap-1.5">
                            <button className="btn btn-success btn-xs" onClick={() => registrar(c.id_cita,'asistio')}>✅ Asistió</button>
                            <button className="btn btn-danger btn-xs" onClick={() => registrar(c.id_cita,'no_asistio')}>❌</button>
                          </div>
                        )}
                        {c.asistencia && (
                          <button className="btn btn-secondary btn-xs" onClick={() => registrar(c.id_cita, c.asistencia === 'asistio' ? 'no_asistio' : 'asistio')}>↩ Cambiar</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      </div>
    </div>
  )
}