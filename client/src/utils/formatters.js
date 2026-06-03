import { format, parseISO, isToday, isTomorrow } from 'date-fns'
import { es } from 'date-fns/locale'

// Formatear fecha larga: "18 de abril de 2026"
export function fmtDate(dateStr) {
  if (!dateStr) return '—'
  return format(parseISO(dateStr), "d 'de' MMMM 'de' yyyy", { locale: es })
}

// Formatear fecha corta: "18 Abr"
export function fmtDateShort(dateStr) {
  if (!dateStr) return '—'
  return format(parseISO(dateStr), "d MMM", { locale: es })
}

// Día y mes separados para el date-box del paciente
export function fmtDateBox(dateStr) {
  if (!dateStr) return { day: '—', month: '—' }
  const d = parseISO(dateStr)
  return {
    day:   format(d, 'd'),
    month: format(d, 'MMM', { locale: es }).toUpperCase()
  }
}

// Etiqueta relativa: "Hoy", "Mañana", o fecha normal
export function fmtRelative(dateStr) {
  if (!dateStr) return '—'
  const d = parseISO(dateStr)
  if (isToday(d))    return 'Hoy'
  if (isTomorrow(d)) return 'Mañana'
  return fmtDateShort(dateStr)
}

// Calcular edad desde fecha de nacimiento
export function calcAge(born) {
  if (!born) return '—'
  const today = new Date()
  const b     = parseISO(born)
  let age = today.getFullYear() - b.getFullYear()
  const m = today.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--
  return age
}

// Mapas de estado
export const STATUS_LABEL = {
  programada:  'Programada',
  confirmada:  'Confirmada',
  en_curso:    'En Curso',
  completada:  'Completada',
  cancelada:   'Cancelada',
}
export const STATUS_CLASS = {
  programada: 'badge-programmed',
  confirmada: 'badge-confirmed',
  en_curso:   'badge-ongoing',
  completada: 'badge-completed',
  cancelada:  'badge-cancelled',
}
export const STATUS_DOT = {
  programada: 'bg-violet-500',
  confirmada: 'bg-blue-500',
  en_curso:   'bg-amber-500',
  completada: 'bg-emerald-500',
  cancelada:  'bg-red-500',
}

export function getStatusLabel(s) { return STATUS_LABEL[s] || s }
export function getStatusClass(s) { return STATUS_CLASS[s] || '' }
export function getStatusDot(s)   { return STATUS_DOT[s]   || 'bg-slate-400' }

// Iniciales del nombre
export function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
}

// Colores de avatar deterministas por nombre
const AVATAR_COLORS = [
  '#2563eb','#7c3aed','#059669','#d97706','#dc2626',
  '#0891b2','#ec4899','#f97316','#14b8a6','#8b5cf6'
]
export function getAvatarColor(name = '') {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

// Formatear moneda PEN
export function fmtMoney(amount) {
  return `S/ ${Number(amount).toFixed(2)}`
}