import { Check, Circle, Clock, AlertCircle } from 'lucide-react'

const ETAPAS_PROCESO = [
  { numero: 1, nombre: '1. Comunicación/Denuncia', corto: 'Denuncia', plazoMaxDias: 2 },
  { numero: 2, nombre: '2. Notificación Apoderados', corto: 'Notificación', plazoMaxDias: 2 },
  { numero: 3, nombre: '3. Recopilación Antecedentes', corto: 'Antecedentes', plazoMaxDias: 5 },
  { numero: 4, nombre: '4. Entrevistas', corto: 'Entrevistas', plazoMaxDias: 5 },
  { numero: 5, nombre: '5. Investigación/Análisis', corto: 'Investigación', plazoMaxDias: 10 },
  { numero: 6, nombre: '6. Resolución y Sanciones', corto: 'Resolución', plazoMaxDias: 2 },
  { numero: 7, nombre: '7. Apelación/Recursos', corto: 'Apelación', plazoMaxDias: 5 },
  { numero: 8, nombre: '8. Seguimiento', corto: 'Seguimiento', plazoMaxDias: null },
]

export default function ProcesoVisualizer({ seguimientos = [], compact = false, fechaInicio = null }) {
  // Obtener etapas completadas desde los seguimientos
  const etapasCompletadas = new Set()
  const etapasConSeguimiento = new Map()
  let etapaActual = null

  seguimientos.forEach(seg => {
    const etapa = seg.fields?.Etapa_Debido_Proceso
    const estado = seg.fields?.Estado_Etapa

    if (etapa) {
      // Extraer el número de la etapa (ej: "1. Comunicación" -> 1)
      const match = etapa.match(/^(\d+)\./)
      if (match) {
        const numEtapa = parseInt(match[1])
        etapasConSeguimiento.set(numEtapa, seg)
        
        if (estado === 'Completada') {
          etapasCompletadas.add(numEtapa)
        } else if (estado === 'En Proceso' || estado === 'Pendiente') {
          etapaActual = numEtapa
        }
      }
    }
  })

  // Calcular etapas vencidas
  const etapasVencidas = []
  const hoy = new Date()
  
  ETAPAS_PROCESO.forEach(etapa => {
    if (!etapasCompletadas.has(etapa.numero) && etapa.plazoMaxDias) {
      const seg = etapasConSeguimiento.get(etapa.numero)
      if (seg && seg.fields?.Fecha) {
        const fechaSeg = new Date(seg.fields.Fecha)
        const diasTranscurridos = Math.floor((hoy - fechaSeg) / (1000 * 60 * 60 * 24))
        
        if (diasTranscurridos > etapa.plazoMaxDias) {
          etapasVencidas.push({
            numero: etapa.numero,
            nombre: etapa.nombre,
            diasVencidos: diasTranscurridos - etapa.plazoMaxDias
          })
        }
      } else if (!seg && fechaInicio && etapa.numero === 1) {
        // Si no hay seguimiento en etapa 1, calcular desde fecha de inicio del caso
        const fechaInicioDate = new Date(fechaInicio)
        const diasTranscurridos = Math.floor((hoy - fechaInicioDate) / (1000 * 60 * 60 * 24))
        if (diasTranscurridos > etapa.plazoMaxDias) {
          etapasVencidas.push({
            numero: etapa.numero,
            nombre: etapa.nombre,
            diasVencidos: diasTranscurridos - etapa.plazoMaxDias
          })
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

  // Calcular porcentaje de progreso
  const porcentaje = Math.round((etapasCompletadas.size / ETAPAS_PROCESO.length) * 100)

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
    <div className="space-y-6">
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

          // Obtener el seguimiento de esta etapa
          const seguimiento = etapasConSeguimiento.get(etapa.numero)
          
          // Verificar si está vencida
          const estaVencida = etapasVencidas.some(e => e.numero === etapa.numero)

          return (
            <div key={etapa.numero}>
              <div className="flex items-start gap-4">
                {/* Indicador visual */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition ${
                      isCompletada
                        ? 'bg-green-600 text-white'
                        : estaVencida
                        ? 'bg-red-600 text-white ring-4 ring-red-100'
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
                        className={`text-base font-bold ${
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
                            <p className="text-gray-700 mt-2 break-words whitespace-pre-wrap">
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
                    <div className="text-right">
                      {isCompletada && (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                          Completada
                        </span>
                      )}
                      {estaVencida && (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                          Vencida
                        </span>
                      )}
                      {isActual && !estaVencida && (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                          En curso
                        </span>
                      )}
                      {etapa.plazoMaxDias && (
                        <div className="text-xs text-gray-500 mt-1">
                          Plazo: {etapa.plazoMaxDias} días
                        </div>
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
