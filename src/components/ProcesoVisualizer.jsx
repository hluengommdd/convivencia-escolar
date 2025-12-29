import { Check, Circle, Clock } from 'lucide-react'

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

export default function ProcesoVisualizer({ seguimientos = [], compact = false }) {
  // Obtener etapas completadas desde los seguimientos
  const etapasCompletadas = new Set()
  let etapaActual = null

  seguimientos.forEach(seg => {
    const etapa = seg.fields?.Etapa_Debido_Proceso
    const estado = seg.fields?.Estado_Etapa

    if (etapa) {
      // Extraer el número de la etapa (ej: "1. Comunicación" -> 1)
      const match = etapa.match(/^(\d+)\./)
      if (match) {
        const numEtapa = parseInt(match[1])
        
        if (estado === 'Completada') {
          etapasCompletadas.add(numEtapa)
        } else if (estado === 'En Proceso' || estado === 'Pendiente') {
          etapaActual = numEtapa
        }
      }
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

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {ETAPAS_PROCESO.map((etapa, index) => {
          const isCompletada = etapasCompletadas.has(etapa.numero)
          const isActual = etapa.numero === etapaActual
          const isPendiente = !isCompletada && !isActual

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
    <div className="bg-white border rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Clock size={20} className="text-blue-600" />
        Progreso del Debido Proceso
      </h3>

      <div className="space-y-4">
        {ETAPAS_PROCESO.map((etapa, index) => {
          const isCompletada = etapasCompletadas.has(etapa.numero)
          const isActual = etapa.numero === etapaActual
          const isPendiente = !isCompletada && !isActual

          // Encontrar el seguimiento relacionado con esta etapa
          const seguimiento = seguimientos.find(seg => {
            const match = seg.fields?.Etapa_Debido_Proceso?.match(/^(\d+)\./)
            return match && parseInt(match[1]) === etapa.numero
          })

          return (
            <div key={etapa.numero}>
              <div className="flex items-start gap-4">
                {/* Indicador visual */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition ${
                      isCompletada
                        ? 'bg-green-600 text-white'
                        : isActual
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {isCompletada ? (
                      <Check size={20} />
                    ) : isActual ? (
                      <Circle size={20} fill="currentColor" />
                    ) : (
                      etapa.numero
                    )}
                  </div>

                  {/* Línea conectora */}
                  {index < ETAPAS_PROCESO.length - 1 && (
                    <div
                      className={`w-0.5 h-8 my-1 ${
                        isCompletada ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>

                {/* Contenido */}
                <div className="flex-1 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4
                        className={`font-semibold ${
                          isActual ? 'text-blue-600' : 'text-gray-900'
                        }`}
                      >
                        {etapa.nombre}
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
                            <p className="text-gray-700 mt-2">
                              {seguimiento.fields.Detalle}
                            </p>
                          )}
                        </div>
                      )}
                      {!seguimiento && isPendiente && (
                        <p className="text-sm text-gray-400 mt-1">
                          Etapa pendiente
                        </p>
                      )}
                      {isActual && !seguimiento && (
                        <p className="text-sm text-blue-600 mt-1">
                          Etapa actual
                        </p>
                      )}
                    </div>

                    {/* Badge de estado */}
                    <div>
                      {isCompletada && (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                          Completada
                        </span>
                      )}
                      {isActual && (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                          En curso
                        </span>
                      )}
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
