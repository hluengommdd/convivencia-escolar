import { Check, Circle, Clock, AlertCircle } from 'lucide-react'

const ETAPAS_PROCESO = [
  { numero: 1, nombre: '1. Comunicación/Denuncia', corto: 'Denuncia' },
  { numero: 2, nombre: '2. Notificación Apoderados', corto: 'Notificación' },
  { numero: 3, nombre: '3. Recopilación Antecedentes', corto: 'Antecedentes' },
  { numero: 4, nombre: '4. Entrevistas', corto: 'Entrevistas' },
  { numero: 5, nombre: '5. Investigación/Análisis', corto: 'Investigación' },
  { numero: 6, nombre: '6. Resolución y Sanciones', corto: 'Resolución' },
  { numero: 7, nombre: '7. Apelación/Recursos', corto: 'Apelación' },
  { numero: 8, nombre: '8. Seguimiento', corto: 'Seguimiento' },
]

export default function ProcesoVisualizer({ seguimientos = [], compact = false, fechaInicio = null, onSelectStep = null }) {
  // Obtener etapas completadas desde los seguimientos
  const etapasCompletadas = new Set()
  const etapasConSeguimiento = new Map()
  let etapaActual = null

  seguimientos.forEach(seg => {
    const tipoAccion = seg.fields?.Tipo_Accion
    const estado = seg.fields?.Estado_Etapa

    if (tipoAccion && estado === 'Completada') {
      // Primero intentar usar Etapa_Debido_Proceso si existe
      const etapaDirecta = seg.fields?.Etapa_Debido_Proceso
      if (etapaDirecta) {
        // Buscar número al inicio: "1. Comunicación", "Etapa 1", etc.
        const match = etapaDirecta.match(/^(\d+)\.?/) || etapaDirecta.match(/Etapa (\d+)/)
        if (match) {
          const numEtapa = parseInt(match[1], 10)
          etapasConSeguimiento.set(numEtapa, seg)
          etapasCompletadas.add(numEtapa)
        }
      } else {
        // Fallback: mapear tipo de acción a número de etapa
        const mapaTipoAEtapa = {
          'Denuncia': 1,
          'Comunicación': 1,
          'Comunicación/Denuncia': 1,
          'Notificación': 2,
          'Notificación Apoderados': 2,
          'Antecedentes': 3,
          'Recopilación Antecedentes': 3,
          'Entrevistas': 4,
          'Investigación': 5,
          'Investigación/Análisis': 5,
          'Resolución': 6,
          'Resolución y Sanciones': 6,
          'Apelación': 7,
          'Apelación/Recursos': 7,
          'Seguimiento': 8
        }
        
        const numEtapa = Object.keys(mapaTipoAEtapa).find(key => tipoAccion.includes(key))
        if (numEtapa) {
          const etapaNum = mapaTipoAEtapa[numEtapa]
          etapasConSeguimiento.set(etapaNum, seg)
          etapasCompletadas.add(etapaNum)
        }
      }
    }
  })

  // Calcular etapas vencidas usando days_to_due del backend
  const etapasVencidas = []
  
  ETAPAS_PROCESO.forEach(etapa => {
    const seguimiento = etapasConSeguimiento.get(etapa.numero)
    const days = seguimiento?.fields?.days_to_due

    if (
      typeof days === 'number' &&
      days < 0 &&
      !etapasCompletadas.has(etapa.numero)
    ) {
      etapasVencidas.push({
        numero: etapa.numero,
        nombre: etapa.nombre,
        diasVencidos: Math.abs(days),
      })
    }
  })

  // Si no hay etapa actual, usar la última completada + 1
  if (!etapaActual && etapasCompletadas.size > 0) {
    const maxCompletada = Math.max(...Array.from(etapasCompletadas))
    if (maxCompletada < 8) {
      etapaActual = maxCompletada + 1
    }
  }

  // Si no hay nada, comenzar en etapa 1
  if (!etapaActual && etapasCompletadas.size === 0) {
    etapaActual = 1
  }

  // Calcular porcentaje de progreso
  const porcentaje = Math.round((etapasCompletadas.size / ETAPAS_PROCESO.length) * 100)

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {ETAPAS_PROCESO.map((etapa, index) => {
          const isCompletada = etapasCompletadas.has(etapa.numero)
          const isActual = etapa.numero === etapaActual

          return (
            <div key={etapa.numero} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition ${
                  isCompletada
                    ? 'bg-green-600 text-white'
                    : isActual
                    ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                    : 'bg-gray-200 text-gray-500'
                }`}
                title={etapa.nombre}
              >
                {isCompletada ? (
                  <Check size={16} />
                ) : (
                  etapa.numero
                )}
              </div>

              {index < ETAPAS_PROCESO.length - 1 && (
                <div
                  className={`w-4 h-0.5 mx-1 ${
                    etapasCompletadas.has(etapa.numero)
                      ? 'bg-green-600'
                      : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
      {/* STEPper horizontal compacto visible en pantallas md+ */}
      <div className="hidden md:block">
        <div className="flex items-center gap-4 overflow-x-auto py-2">
          {ETAPAS_PROCESO.map((etapa) => {
            const isCompletada = etapasCompletadas.has(etapa.numero)
            const isActual = etapa.numero === etapaActual
            const estaVencida = etapasVencidas.some(e => e.numero === etapa.numero)
            const seguimiento = etapasConSeguimiento.get(etapa.numero)

            const tooltipLines = []
            tooltipLines.push(etapa.nombre)
            if (seguimiento) {
              if (seguimiento.fields?.Fecha) tooltipLines.push(`Fecha: ${seguimiento.fields.Fecha}`)
              if (seguimiento.fields?.Responsable) tooltipLines.push(`Responsable: ${seguimiento.fields.Responsable}`)
            } else {
              tooltipLines.push(isActual ? 'Etapa actual' : 'Pendiente')
            }

            const bgClass = isCompletada ? 'bg-green-600 text-white' : (estaVencida ? 'bg-red-600 text-white' : (isActual ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'))

            return (
              <div key={etapa.numero} className="flex flex-col items-center min-w-[64px]">
                <button
                  onClick={() => seguimiento && onSelectStep && onSelectStep(seguimiento.id)}
                  title={tooltipLines.join('\n')}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${bgClass} transition-shadow hover:scale-105`}
                >
                  {isCompletada ? '✔' : etapa.numero}
                </button>
                <div className={`text-xs mt-2 text-center ${isActual ? 'text-blue-600 font-semibold' : 'text-gray-600'}`}>
                  <span className="hidden xl:inline">{etapa.corto}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      {/* ALERTAS DE ETAPAS VENCIDAS */}
      {etapasVencidas.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-900 mb-2">Etapas fuera de plazo</h4>
              <ul className="space-y-1 text-sm">
                {etapasVencidas.map(etapa => (
                  <li key={etapa.numero} className="text-red-700">
                    <strong>{etapa.nombre}:</strong> vencida hace {etapa.diasVencidos} día(s)
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Barra de progreso */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">Progreso general</span>
          <span className="text-sm font-bold text-blue-600">{porcentaje}%</span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 transition-all"
            style={{ width: `${porcentaje}%` }}
          />
        </div>
        <p className="text-xs text-gray-600 mt-2">
          {etapasCompletadas.size} de {ETAPAS_PROCESO.length} etapas completadas
        </p>
      </div>

      <div className="space-y-4">
        {ETAPAS_PROCESO.map((etapa, index) => {
          const isCompletada = etapasCompletadas.has(etapa.numero)
          const isActual = etapa.numero === etapaActual
          const isPendiente = !isCompletada && !isActual

          const seguimiento = etapasConSeguimiento.get(etapa.numero)
          const estaVencida = etapasVencidas.some(e => e.numero === etapa.numero)

          return (
            <div key={etapa.numero}>
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition ${isCompletada ? 'bg-green-600 text-white' : estaVencida ? 'bg-red-600 text-white ring-4 ring-red-100' : isActual ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-gray-200 text-gray-500'}`}>
                    {isCompletada ? (
                      <Check size={20} />
                    ) : isActual ? (
                      <Circle size={20} fill="currentColor" />
                    ) : (
                      etapa.numero
                    )}
                  </div>

                  {index < ETAPAS_PROCESO.length - 1 && (
                    <div className={`w-0.5 h-8 my-1 ${isCompletada ? 'bg-green-600' : 'bg-gray-200'}`} />
                  )}
                </div>

                <div className="flex-1 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className={`text-base font-bold ${isActual ? 'text-blue-600' : 'text-gray-900'}`}>
                        {onSelectStep && seguimiento ? (
                          <button
                            onClick={() => onSelectStep(seguimiento.id)}
                            className="text-left text-base font-bold hover:underline"
                            aria-label={`Ir a seguimiento de etapa ${etapa.numero}`}
                          >
                            {etapa.nombre}
                          </button>
                        ) : (
                          etapa.nombre
                        )}
                      </h4>

                      {seguimiento && (
                        <div className="mt-2 text-sm space-y-1">
                          <p className="text-gray-600">
                            <strong>Fecha:</strong> {seguimiento.fields?.Fecha}
                          </p>
                          {seguimiento.fields?.Responsable && (
                            <p className="text-gray-600">
                              <strong>Responsable:</strong>{' '}
                              {seguimiento.fields.Responsable}
                            </p>
                          )}
                          {seguimiento.fields?.Detalle && (
                            <p className="text-gray-700 mt-2 break-words whitespace-pre-wrap">
                              {seguimiento.fields.Detalle}
                            </p>
                          )}
                        </div>
                      )}

                      {!seguimiento && isPendiente && (
                        <p className="text-sm text-gray-400 mt-1">Etapa pendiente</p>
                      )}

                      {isActual && !seguimiento && (
                        <p className="text-sm text-blue-600 mt-1">Etapa actual</p>
                      )}
                    </div>

                    <div className="text-right">
                      {isCompletada && (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">Completada</span>
                      )}
                      {estaVencida && (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">Vencida</span>
                      )}
                      {isActual && !estaVencida && (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">En curso</span>
                      )}
                      {
                        (() => {
                          const d = seguimiento?.fields?.days_to_due
                          const badge = d == null ? '—' : `${d}d`
                          return <div className="text-xs text-gray-500 mt-1">Plazo: {badge}</div>
                        })()
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Resumen */}
      <div className="mt-6 pt-4 border-t">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-600 rounded-full" />
              <span className="text-gray-600">
                {etapasCompletadas.size} completadas
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full" />
              <span className="text-gray-600">1 en curso</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-200 rounded-full" />
              <span className="text-gray-600">
                {8 - etapasCompletadas.size - 1} pendientes
              </span>
            </div>
          </div>

          <div className="text-gray-600">
            <strong>Progreso:</strong>{' '}
            <span className="text-blue-600 font-semibold">
              {Math.round((etapasCompletadas.size / 8) * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
