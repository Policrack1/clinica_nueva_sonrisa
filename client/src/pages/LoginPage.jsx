import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff } from 'lucide-react'

const ROLES = [
  { key: 'admin',    label: 'Administrador', icon: '🛡️', email: 'admin@sonrisa.com',   pass: 'admin123' },
  { key: 'doctor',   label: 'Odontólogo',    icon: '🩺', email: 'maria@sonrisa.com',   pass: 'doctor123' },
  { key: 'paciente', label: 'Paciente',       icon: '👤', email: 'juan@gmail.com',      pass: 'paciente123' },
]

export default function LoginPage() {
  const { login }   = useAuth()
  const navigate    = useNavigate()

  const [selectedRole, setSelectedRole] = useState('admin')
  const [email,    setEmail]    = useState('admin@sonrisa.com')
  const [password, setPassword] = useState('admin123')
  const [showPass, setShowPass] = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  function pickRole(r) {
    setSelectedRole(r.key)
    setEmail(r.email)
    setPassword(r.pass)
    setError('')
  }

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(email, password)
      if (user.rol === 'Administrador') navigate('/admin')
      else if (user.rol === 'Odontologo') navigate('/doctor')
      else navigate('/paciente')
    } catch (err) {
      setError(err.response?.data?.message || 'Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-2">

      {/* ── Lado izquierdo ── */}
      <div className="relative overflow-hidden flex flex-col justify-between p-12"
           style={{ background: 'linear-gradient(145deg,#1d4ed8,#0ea5e9)' }}>
        {/* Fondo */}
        <div className="absolute inset-0 opacity-15"
             style={{ backgroundImage: "url('https://images.unsplash.com/photo-1629909615518-59f5c96bcc56?w=1200&q=60')", backgroundSize:'cover', backgroundPosition:'center' }} />
        <div className="absolute inset-0" style={{ background:'linear-gradient(145deg,rgba(29,78,216,.88),rgba(14,165,233,.82))' }} />

        {/* Brand */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-2xl backdrop-blur">🦷</div>
          <span className="font-sora text-lg font-bold text-white">Nueva Sonrisa</span>
        </div>

        {/* Texto */}
        <div className="relative z-10">
          <h1 className="font-sora text-[38px] font-extrabold text-white leading-tight mb-3">
            Bienvenido a<br/>Nueva Sonrisa
          </h1>
          <p className="text-white/80 text-[15px] leading-relaxed max-w-sm">
            Sistema integral de gestión odontológica. Administra citas, pacientes y más desde un solo lugar.
          </p>
          <div className="flex gap-8 mt-8">
            {[['500+','Pacientes'],['12','Odontólogos'],['98%','Satisfacción']].map(([n,l]) => (
              <div key={l}>
                <div className="font-sora text-3xl font-extrabold text-white">{n}</div>
                <div className="text-white/60 text-xs mt-1">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Lado derecho ── */}
      <div className="bg-white flex items-center justify-center p-12">
        <div className="w-full max-w-[400px]">

          {/* Logo */}
          <div className="text-center mb-7">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border-2 border-blue-100
                            inline-flex items-center justify-center text-3xl mb-3">🦷</div>
            <h2 className="font-sora text-2xl font-bold text-slate-800">Nueva Sonrisa</h2>
            <p className="text-sm text-slate-400 mt-1">Inicia sesión para continuar</p>
          </div>

          {/* Selector de rol */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            {ROLES.map(r => (
              <button
                key={r.key}
                onClick={() => pickRole(r)}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl
                            border-2 text-xs font-bold transition-all
                            ${selectedRole === r.key
                              ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-[0_0_0_3px_rgba(37,99,235,.1)]'
                              : 'border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-500'
                            }`}
              >
                <span className="text-xl">{r.icon}</span>
                <span>{r.label}</span>
              </button>
            ))}
          </div>

          {/* Demo hint */}
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-lg
                          px-3 py-2 text-center text-xs text-slate-400 mb-4">
            Demo: Selecciona un rol y haz clic en <strong className="text-blue-600">Ingresar</strong>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="form-label">Correo electrónico</label>
              <input
                className="form-control"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                required
              />
            </div>
            <div>
              <label className="form-label">Contraseña</label>
              <div className="relative">
                <input
                  className="form-control pr-10"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm
                              px-3 py-2 rounded-lg">
                ❌ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-[15px] font-bold text-white
                         bg-blue-600 hover:bg-blue-700 transition-all shadow-md
                         hover:shadow-blue-200 hover:shadow-lg disabled:opacity-60
                         disabled:cursor-not-allowed"
            >
              {loading ? 'Ingresando...' : `Ingresar como ${ROLES.find(r=>r.key===selectedRole)?.label}`}
            </button>
          </form>

        </div>
      </div>

      {/* Responsive: ocultar lado izquierdo en móvil */}
      <style>{`@media(max-width:768px){.grid-cols-2{grid-template-columns:1fr}div:first-child{display:none}}`}</style>
    </div>
  )
}