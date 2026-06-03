export function EmptyState({
  icon = '📭',
  title = 'Sin resultados',
  desc = ''
}) {
  return (
    <div className="text-center py-12 text-slate-400">
      <div className="text-4xl mb-3">{icon}</div>
      <div className="font-semibold text-slate-500">{title}</div>

      {desc && (
        <div className="text-sm mt-1">
          {desc}
        </div>
      )}
    </div>
  )
}