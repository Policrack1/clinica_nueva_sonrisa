export function StatCard({
  icon,
  value,
  label,
  change,
  changeUp,
  color = 'bg-blue-100'
}) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>
        {icon}
      </div>

      <div>
        <div className="stat-num">{value ?? '—'}</div>
        <div className="stat-label">{label}</div>

        {change && (
          <div className={`stat-change ${changeUp ? 'text-emerald-600' : 'text-red-500'}`}>
            {changeUp ? '↑' : '↓'} {change}
          </div>
        )}
      </div>
    </div>
  )
}