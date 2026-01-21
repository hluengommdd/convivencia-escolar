const LOCAL_TZ = 'America/Santiago'

// Formatea fechas sin perder el día por desfase de zona horaria (UTC vs local)
export function formatDate(fecha, withTime = false) {
  if (!fecha) return '—'

  const raw = typeof fecha === 'string' ? fecha : String(fecha)
  const datePart = raw.slice(0, 10)

  // Si la fecha viene sin hora (YYYY-MM-DD) o a medianoche UTC, evitamos el shift
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(raw) || /T00:00(:00\.000)?Z?$/.test(raw)
  if (isDateOnly) {
    const [y, m, d] = datePart.split('-').map(Number)
    if ([y, m, d].some(Number.isNaN)) return raw

    const utcDate = new Date(Date.UTC(y, m - 1, d))
    const date = utcDate.toLocaleDateString('es-CL', { timeZone: 'UTC' })
    if (!withTime) return date
    return `${date} 00:00`
  }

  const d = new Date(raw)
  if (isNaN(d.getTime())) return raw

  const date = d.toLocaleDateString('es-CL', { timeZone: LOCAL_TZ })
  if (!withTime) return date

  const time = d.toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: LOCAL_TZ,
  })

  return `${date} ${time}`
}
