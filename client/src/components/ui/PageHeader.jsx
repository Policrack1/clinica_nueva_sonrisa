export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
      <div>
        <h2 className="font-sora text-[22px] font-bold text-slate-800">
          {title}
        </h2>

        {subtitle && (
          <p className="text-sm text-slate-400 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {children && (
        <div className="flex gap-2 flex-wrap">
          {children}
        </div>
      )}
    </div>
  )
}