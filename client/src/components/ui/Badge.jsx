import { getStatusClass, getStatusLabel } from '../../utils/formatters'

export function StatusBadge({ status }) {
  return (
    <span className={`badge ${getStatusClass(status)}`}>
      {getStatusLabel(status)}
    </span>
  )
}

export function RoleBadge({ role }) {
  const cls = {
    Administrador: 'badge-admin',
    Odontologo: 'badge-doctor',
    Paciente: 'badge-patient'
  }[role] || ''

  return (
    <span className={`badge ${cls}`}>
      {role}
    </span>
  )
}