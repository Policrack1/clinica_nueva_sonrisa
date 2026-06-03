export function Spinner({ className = '' }) {
  return (
    <div className={`flex justify-center items-center py-16 ${className}`}>
      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  )
}