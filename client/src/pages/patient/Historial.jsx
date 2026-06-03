// src/pages/patient/Historial.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { PageHeader, Spinner, EmptyState } from '../../components/ui/index'
import { fmtDate } from '../../utils/formatters'
import api from '../../utils/api'

export default function PatientHistorial() {
  const { user }    = useAuth()
  const [historial, setHistorial] = useState([])
  const [paciente,  setPaciente]  = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [expanded,  setExpanded]  = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const pRes  = await api.get('/pacientes')
      const myPac = (pRes.data.data || []).find(p => p.email === user?.email)
      if (!myPac) return
      setPaciente(myPac)

      const hRes = await api.get(`/historial/${myPac.id_paciente}`)
      setHistorial(hRes.data.data || [])
    } catch { }
    finally { setLoading(false) }
  }

  if (loading) return <Spinner />

  return (
    <div>
      <PageHeader
        title="Mi Historial Clínico"
        subtitle="Registro completo de tus atenciones odontológicas"
      />

      {/* ── Stats del paciente ── */}
      {paciente && (
        <div className="grid grid-cols-4 gap-3.5 mb-5">
          <div className="stat-card">
            <div className="stat-icon bg-blue-100">🦷</div>
            <div>
              <div className="stat-num">{historial.length}</div>
              <div className="stat-label">Atenciones realizadas</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon bg-emerald-100">🩸</div>
            <div>
              <div className="stat-num">{paciente.grupo_sanguineo || '—'}</div>
              <div className="stat-label">Grupo sanguíneo</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon bg-amber-100">⚠️</div>
            <div>
              <div className="stat-num text-sm leading-tight mt-1">
                {paciente.alergias || 'Ninguna'}
              </div>
              <div className="stat-label">Alergias</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon bg-violet-100">📅</div>
            <div>
              <div className="stat-num text-sm leading-tight mt-1">
                {historial.length > 0
                  ? fmtDate(historial[0]?.fecha_cita?.split('T')[0])
                  : '—'}
              </div>
              <div className="stat-label">Última atención</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Alerta alergias ── */}
      {paciente?.alergias && paciente.alergias !== 'Ninguna' && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 mb-5 flex items-center gap-3">
          <span className="text-2xl flex-shrink-0">⚠️</span>
          <div>
            <div className="font-bold text-red-700 text-sm">Alergia registrada</div>
            <div className="text-red-600 text-xs mt-0.5">
              Tienes registrada alergia a: <strong>{paciente.alergias}</strong>.
              Informa siempre a tu odontólogo antes de cualquier procedimiento.
            </div>
          </div>
        </div>
      )}

      {/* ── Lista historial ── */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Historial de atenciones</span>
          <span className="text-xs text-slate-400">
            {historial.length} registro{historial.length !== 1 ? 's' : ''}
          </span>
        </div>

        {historial.length === 0
          ? (
            <div className="p-8">
              <EmptyState
                icon="🏥"
                title="Sin historial clínico"
                desc="Aún no tienes atenciones completadas registradas"
              />
            </div>
          )
          : (
            <div className="divide-y divide-slate-100">
              {historial.map(h => (
                <div
                  key={h.id_historial}
                  className="px-5 py-4 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => setExpanded(expanded === h.id_historial ? null : h.id_historial)}
                >
                  {/* ── Fila principal ── */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-4">
                      {/* Date box */}
                      <div className="bg-blue-50 rounded-xl p-2.5 text-center min-w-[52px] flex-shrink-0">
                        <div className="font-sora font-bold text-blue-600 text-lg leading-none">
                          {h.fecha_cita
                            ? new Date(h.fecha_cita + 'T00:00:00').getDate()
                            : '—'}
                        </div>
                        <div className="text-[10px] font-bold text-blue-400 mt-0.5 uppercase">
                          {h.fecha_cita
                            ? new Date(h.fecha_cita + 'T00:00:00')
                                .toLocaleString('es-PE', { month: 'short' })
                            : ''}
                        </div>
                      </div>

                      <div>
                        <div className="font-bold text-sm text-slate-800">
                          🦷 {h.nombre_tratamiento}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          👨‍⚕️ {h.nombre_odontologo} · ⏰ {h.hora_cita?.slice(0, 5)}
                        </div>
                        {/* Preview diagnóstico cuando está cerrado */}
                        {expanded !== h.id_historial && h.diagnostico && (
                          <div className="text-xs text-slate-500 mt-1.5 line-clamp-1 italic">
                            "{h.diagnostico}"
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="badge badge-completed">✅ Completada</span>
                      <span className="text-slate-400 text-sm">
                        {expanded === h.id_historial ? '▲' : '▼'}
                      </span>
                    </div>
                  </div>

                  {/* ── Detalle expandible ── */}
                  {expanded === h.id_historial && (
                    <div className="mt-4 pl-[68px] space-y-3">

                      {h.diagnostico && (
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1.5">
                            Diagnóstico
                          </div>
                          <div className="bg-blue-50 border-l-2 border-blue-400 rounded-r-lg px-4 py-3 text-sm text-slate-700">
                            {h.diagnostico}
                          </div>
                        </div>
                      )}

                      {h.trat_realizado && (
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1.5">
                            Tratamiento realizado
                          </div>
                          <div className="text-sm text-slate-700 bg-slate-50 px-4 py-3 rounded-lg">
                            🦷 {h.trat_realizado}
                          </div>
                        </div>
                      )}

                      {h.medicamentos && h.medicamentos !== 'Ninguno' && (
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1.5">
                            Medicamentos indicados
                          </div>
                          <div className="text-sm text-slate-700 bg-amber-50 border-l-2 border-amber-400 rounded-r-lg px-4 py-3">
                            💊 {h.medicamentos}
                          </div>
                        </div>
                      )}

                      {h.proxima_revision && (
                        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-4 py-2.5 rounded-lg">
                          <span>🔜</span>
                          <span className="font-semibold">
                            Próxima revisión recomendada:{' '}
                            {fmtDate(h.proxima_revision?.split('T')[0])}
                          </span>
                        </div>
                      )}

                      <div className="text-xs text-slate-400 pt-1">
                        Registrado el {fmtDate(h.fecha_registro?.split('T')[0])}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
      </div>

      {/* ── Footer info ── */}
      <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 flex items-start gap-3">
        <span className="text-xl flex-shrink-0">ℹ️</span>
        <div className="text-sm text-blue-700">
          <strong>¿Tienes dudas sobre tu historial?</strong> Contacta a tu odontólogo en{' '}
          <span className="font-semibold">citas@nuevasonrisa.pe</span> o llámanos al{' '}
          <span className="font-semibold">+51 987 654 321</span>.
        </div>
      </div>
    </div>
  )
}