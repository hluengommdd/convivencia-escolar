import React from 'react'

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '🙂'
  const first = parts[0]?.[0] || ''
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : ''
  return (first + last).toUpperCase() || '🙂'
}

function tipColor(tipificacion) {
  switch (tipificacion) {
    case 'Leve':
      return 'bg-green-100 text-green-800'
    case 'Grave':
      return 'bg-yellow-100 text-yellow-800'
    case 'Muy Grave':
      return 'bg-purple-100 text-purple-800'
    case 'Gravísima':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default function CaseStudentHeaderCard({
  label = 'Estudiante',
  studentName = '—',
  course = '—',
  tipificacion = '—',
  estado = '—',
  falta = '',
  overdueLabel = null,
  isOverdue = false,
}) {
  return (
    <div className="rounded-xl overflow-hidden border shadow-sm">
      <div className="bg-slate-700 px-5 py-4 text-white">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center font-bold">
            {getInitials(studentName)}
          </div>

          {/* Textos */}
          <div className="min-w-0 flex-1">
            <div className="text-xs opacity-80">{label}</div>
            <div className="text-lg font-bold leading-snug truncate">{studentName}</div>
            <div className="text-sm opacity-90">Curso: <span className="font-semibold">{course}</span></div>

            {/* Chips */}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${tipColor(tipificacion)}`}>
                {tipificacion}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900">
                {estado}
              </span>

              {isOverdue && overdueLabel ? (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900">
                  {overdueLabel}
                </span>
              ) : null}
            </div>

            {/* Falta */}
            {falta ? (
              <div className="mt-3 text-xs text-white/80">
                Falta: <span className="text-white font-semibold">{falta}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
