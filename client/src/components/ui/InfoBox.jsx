export function InfoBox({ type = 'blue', icon, children }) {
  const cls = {
    blue: 'info-blue',
    green: 'info-green',
    amber: 'info-amber',
    red: 'info-red'
  }[type]

  return (
    <div className={`info-box ${cls} mb-3`}>
      {icon && (
        <span className="text-base flex-shrink-0">
          {icon}
        </span>
      )}

      <div>{children}</div>
    </div>
  )
}