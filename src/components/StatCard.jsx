export default function StatCard({ title, value, subtitle, icon, color, onClick }) {
  const handleKey = (e) => {
    if (!onClick) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={handleKey}
      onClick={onClick}
      className={`card flex items-center justify-between hover:scale-[1.02] transition-all duration-200 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
        )}
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} shadow-lg`}>
        {icon}
      </div>
    </div>
  )
}
