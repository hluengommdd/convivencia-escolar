export default function UrgentCaseCard({ title, student, date, level }) {
  const levelStyles = {
    'Muy Grave': 'bg-red-100 text-red-700 shadow-sm',
    'Gravísima': 'bg-red-200 text-red-800 shadow-sm',
  }

  return (
    <div className="bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200/50 rounded-2xl p-5 mb-3 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-semibold text-gray-900 text-base">{title}</p>
          <p className="text-sm text-gray-700 mt-1">{student}</p>
          <p className="text-xs text-gray-600 mt-2">Ocurrió el {date}</p>
        </div>
        <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${levelStyles[level]}`}>
          {level}
        </span>
      </div>
    </div>
  )
}
