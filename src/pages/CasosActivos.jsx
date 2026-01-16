import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { getCases } from '../api/db'
import CaseDetailPanel from '../components/CaseDetailPanel'
import NuevoCasoModal from '../components/NuevoCasoModal'
import { formatDate } from '../utils/formatDate'
import { onDataUpdated } from '../utils/refreshBus'

export default function CasosActivos() {
  const [casos, setCasos] = useState([])
  const [selectedCaso, setSelectedCaso] = useState(null)
  const [loading, setLoading] = useState(true)
  const [nuevo, setNuevo] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // ✅ LEER QUERY PARAM ?caso=recXXXX
  const [searchParams] = useSearchParams()
  const selectedId = searchParams.get('caso')

  useEffect(() => {
    async function cargar() {
      try {
        setLoading(true)
        const data = await getCases()

        // Solo casos no cerrados
        const activos = data.filter(c => c.fields?.Estado !== 'Cerrado')
        setCasos(activos)

        // Seleccionar caso automáticamente desde query param
        if (selectedId) {
          const encontrado = activos.find(c => c.id === selectedId)
          if (encontrado) setSelectedCaso(encontrado)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }

    cargar()

    // ✅ Escuchar cambios de datos
    const off = onDataUpdated(() => {
      console.log('🔄 Refrescando casos activos...')
      cargar()
    })

    return () => off()
  }, [selectedId, refreshKey])

  return (
    <div className="h-full">
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 h-full">
        {/* LISTA IZQUIERDA */}
        <div className="w-full lg:w-1/2 bg-white border rounded-lg sm:rounded-xl overflow-hidden flex flex-col">
          <div className="px-3 sm:px-4 py-2 sm:py-3 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
            <h2 className="text-base sm:text-lg font-semibold">
              Casos Activos
            </h2>
            <button
              onClick={() => setNuevo(true)}
              className="flex items-center gap-2 bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-700 transition text-xs sm:text-sm font-medium w-full sm:w-auto justify-center sm:justify-start"
            >
              <Plus size={16} className="sm:size-18" />
              Nuevo Caso
            </button>
          </div>

          {/* ENCABEZADO */}
          <div className="hidden sm:grid grid-cols-12 gap-2 px-3 sm:px-4 py-2 text-xs font-semibold text-gray-500 border-b">
            <div className="sm:col-span-1">#</div>
            <div className="sm:col-span-3">Fecha</div>
            <div className="sm:col-span-4">Estudiante</div>
            <div className="sm:col-span-2">Tipif.</div>
            <div className="sm:col-span-2">Estado</div>
          </div>

          {/* LISTA */}
          <div className="overflow-y-auto flex-1">
            {loading && (
              <p className="p-3 sm:p-4 text-gray-500 text-xs sm:text-sm">
                Cargando casos…
              </p>
            )}

            {!loading &&
              casos.map((caso, index) => (
                <div
                  key={caso.id}
                  onClick={() => setSelectedCaso(caso)}
                  className={`grid grid-cols-1 sm:grid-cols-12 gap-2 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm border-b cursor-pointer hover:bg-gray-50 transition
                      ${
                        selectedCaso?.id === caso.id
                          ? 'bg-blue-50 border-l-4 border-blue-500'
                          : ''
                      }`}
                >
                    <div className="sm:col-span-1 text-gray-400 hidden sm:block">
                    {index + 1}
                  </div>

                    <div className="sm:col-span-3">
                    <p className="font-medium">
                     {formatDate(caso.fields.Fecha_Incidente)}
                  </p>
                    <p className="text-xs text-gray-400">
                      {caso.fields.Hora_Incidente}
                    </p>
                  </div>

                    <div className="sm:col-span-4 font-semibold truncate">
                    {caso.fields.Estudiante_Responsable}
                  </div>

                    <div className="sm:col-span-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium
                        ${
                          caso.fields.Tipificacion_Conducta === 'Leve'
                            ? 'bg-green-100 text-green-800'
                            : caso.fields.Tipificacion_Conducta === 'Muy Grave'
                            ? 'bg-purple-100 text-purple-800'
                            : caso.fields.Tipificacion_Conducta === 'Gravísima'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                    >
                      {caso.fields.Tipificacion_Conducta}
                    </span>
                  </div>

                  <div className="col-span-2">
                    <span className="px-2 py-1 rounded-full text-xs bg-gray-200 text-gray-700">
                      {caso.fields.Estado}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* PANEL DERECHO */}
        <div className="w-full lg:w-1/2 card overflow-hidden flex flex-col">
          {selectedCaso ? (
            <div className="flex-1 overflow-y-auto">
              <CaseDetailPanel
                caso={selectedCaso}
                onClose={() => setSelectedCaso(null)}
                setRefreshKey={setRefreshKey}
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
              Selecciona un caso para ver el detalle
            </div>
          )}
        </div>
      </div>

      {nuevo && (
        <NuevoCasoModal
          onClose={() => setNuevo(false)}
          onSaved={() => {
            setNuevo(false)
            setRefreshKey(k => k + 1)
          }}
        />
      )}
    </div>
  )
}
