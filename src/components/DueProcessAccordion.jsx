import { useMemo, useState, useEffect } from 'react'

function norm(s) {
  return (s || '').trim().replace(/\s+/g, ' ')
}

function groupByStage(followups = []) {
  const map = new Map()
  for (const f of followups) {
    const stage = norm(f?.fields?.Etapa_Debido_Proceso) || 'Sin etapa'
    if (!map.has(stage)) map.set(stage, [])
    map.get(stage).push(f)
  }
  for (const [k, arr] of map.entries()) {
    arr.sort((a, b) => (a?.fields?.Fecha || '').localeCompare(b?.fields?.Fecha || ''))
  }
  return map
}

function titleFromFields(ff) {
  return ff?.Acciones || ff?.Descripcion || ff?.Tipo_Accion || 'Acción'
}

function fmtDate(iso) {
  if (!iso) return '—'
  const [y, m, d] = String(iso).split('-')
  if (!y || !m || !d) return iso
  return `${d}-${m}-${y}`
}

export default function DueProcessAccordion({
  stages = [],
  followups = [],
  currentStageKey = null,
  onAddActionForStage,
}) {
  const grouped = useMemo(() => groupByStage(followups), [followups])
  const [openKey, setOpenKey] = useState(null)

  useEffect(() => {
    if (currentStageKey) setOpenKey(currentStageKey)
  }, [currentStageKey])

  return (
    <div className="bg-white rounded-2xl border overflow-hidden">
      {stages.map((stageKey) => {
        const items = grouped.get(stageKey) || []
        const count = items.length
        const isOpen = openKey === stageKey

        return (
          <div key={stageKey} className="border-b last:border-b-0">
            <button
              type="button"
              onClick={() => setOpenKey(isOpen ? null : stageKey)}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="min-w-0 text-left">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-extrabold text-gray-900 truncate">
                    {stageKey}
                  </div>
                  <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {count} acc.
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {count > 0 ? 'Ver acciones de esta etapa' : 'Sin acciones registradas'}
                </div>
              </div>
              <span className="text-gray-400 text-lg">{isOpen ? '▾' : '▸'}</span>
            </button>

            {isOpen && (
              <div className="px-5 pb-5">
                {count === 0 ? (
                  <>
                    <div className="text-sm text-gray-600 mt-2">
                      No hay acciones en esta etapa.
                    </div>
                    <button
                      type="button"
                      onClick={() => onAddActionForStage?.(stageKey)}
                      className="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                      + Registrar acción
                    </button>
                  </>
                ) : (
                  <div className="mt-3 space-y-3">
                    {items.map((f) => {
                      const ff = f?.fields || {}
                      return (
                        <div key={f.id} className="border rounded-xl p-4 bg-white">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-gray-900">
                                {titleFromFields(ff)}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Fecha: {fmtDate(ff.Fecha)} · Responsable: {ff.Responsable || '—'}
                              </div>
                              {ff.Detalle && (
                                <div className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">
                                  {ff.Detalle}
                                </div>
                              )}
                            </div>
                            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">
                              {ff.Estado_Etapa || '—'}
                            </span>
                          </div>
                        </div>
                      )
                    })}

                    <button
                      type="button"
                      onClick={() => onAddActionForStage?.(stageKey)}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                      + Registrar acción
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
