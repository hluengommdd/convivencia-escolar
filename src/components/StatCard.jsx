export default function StatCard({ title, value, subtitle, icon, color }) {
  return (
    <div className="card flex items-center justify-between hover:scale-[1.02] transition-all duration-200">
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
