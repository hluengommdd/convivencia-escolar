export default function UrgentCaseCard({ title, student, date, level }) {
  const levelStyles = {
    'Muy Grave': 'bg-red-100 text-red-700',
    'Gravísima': 'bg-red-200 text-red-800',
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-3">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-semibold text-gray-800">{title}</p>
          <p className="text-sm text-gray-600">{student}</p>
          <p className="text-xs text-gray-500 mt-1">Ocurrió el {date}</p>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded ${levelStyles[level]}`}>
          {level}
        </span>
      </div>
    </div>
  )
}
