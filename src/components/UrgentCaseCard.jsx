export default function UrgentCaseCard({ title, student, date, level }) {
  const levelStyles = {
    Leve: 'bg-green-100 text-green-800',
    Grave: 'bg-yellow-100 text-yellow-800',
    'Muy Grave': 'bg-purple-100 text-purple-800',
    Gravísima: 'bg-red-100 text-red-800',
  }

  return (
    <div className="card mb-3">
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
