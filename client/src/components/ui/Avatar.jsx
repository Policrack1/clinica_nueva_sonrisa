import { getInitials, getAvatarColor } from '../../utils/formatters'

export function Avatar({ name = '', size = 36, className = '' }) {
  return (
    <div
      className={`avatar flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background: getAvatarColor(name),
        fontSize: size * 0.35,
      }}
    >
      {getInitials(name)}
    </div>
  )
}