import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getCases } from '../api/db'
import SeguimientoPage from './SeguimientoPage'
import { formatDate } from '../utils/formatDate'

export default function Seguimientos() {
  const [casos, setCasos] = useState([])
  const [selectedCaso, setSelectedCaso] = useState(null)
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

    useEffect(() => {
      async function cargar() {
        try {
          setLoading(true)
          const data = await getCases()

          // SOLO CASOS EN SEGUIMIENTO (EXCLUYE CERRADOS)
          const enSeguimiento = data.filter(
            c => c.fields?.Estado && c.fields.Estado !== 'Cerrado'
          )

          // Si se pasó ?estudiante=Nombre, filtrar por ese estudiante
          const estudianteParam = searchParams.get('estudiante')
          let finalList = enSeguimiento
          if (estudianteParam) {
            const decoded = decodeURIComponent(estudianteParam)
            finalList = enSeguimiento.filter(c => (
              (c.fields?.Estudiante_Responsable || '').toLowerCase().includes(decoded.toLowerCase())
            ))
          }

          setCasos(finalList)

          // Si hay un estudiante filtrado, seleccionar el primer caso automáticamente
          if (estudianteParam && finalList.length > 0) {
            setSelectedCaso(finalList[0])
          }
        } catch (e) {
          console.error(e)
        } finally {
          setLoading(false)
        }
      }

      cargar()
    }, [refreshKey])

  return (
    <div className="h-full">
      <div className="flex gap-6 h-full">
        {/* LISTA IZQUIERDA */}
        <div className="w-1/2 bg-white border rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b">
            <h2 className="text-lg font-semibold">Casos en Seguimiento</h2>
          </div>

          {/* ENCABEZADO */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs font-semibold text-gray-500 border-b">
            <div className="col-span-1">#</div>
            <div className="col-span-3">Fecha</div>
            <div className="col-span-4">Estudiante</div>
            <div className="col-span-2">Tipificación</div>
            <div className="col-span-2">Estado</div>
          </div>

          <div className="overflow-y-auto flex-1">
            {loading && <p className="p-4 text-gray-500 text-sm">Cargando casos…</p>}

            {!loading &&
              casos.map((caso, index) => (
                <div
                  key={caso.id}
                  onClick={() => setSelectedCaso(caso)}
                  className={`grid grid-cols-12 gap-2 px-4 py-3 text-sm border-b cursor-pointer hover:bg-gray-50
                    ${selectedCaso?.id === caso.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                >
                  <div className="col-span-1 text-gray-400">{index + 1}</div>

                  <div className="col-span-3">
                    <p className="font-medium">{formatDate(caso.fields.Fecha_Incidente)}</p>
                    <p className="text-xs text-gray-400">{caso.fields.Hora_Incidente}</p>
                  </div>

                  <div className="col-span-4 font-semibold truncate">{caso.fields.Estudiante_Responsable}</div>

                  <div className="col-span-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium
                        ${
                          caso.fields.Tipificacion_Conducta === 'Leve'
                            ? 'bg-green-100 text-green-800'
                            : caso.fields.Tipificacion_Conducta === 'Grave'
                            ? 'bg-yellow-100 text-yellow-800'
                            : caso.fields.Tipificacion_Conducta === 'Muy Grave'
                            ? 'bg-purple-100 text-purple-800'
                            : caso.fields.Tipificacion_Conducta === 'Gravísima'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100'
                        }`}
                    >
                      {caso.fields.Tipificacion_Conducta}
                    </span>
                  </div>

                  <div className="col-span-2">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {caso.fields.Estado}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* PANEL DERECHO */}
        <div className="flex-1 card overflow-hidden flex flex-col">
          {!selectedCaso && (
            <div className="h-full flex items-center justify-center text-gray-400">Selecciona un caso para ver el seguimiento</div>
          )}

          {selectedCaso && (
            <div className="flex-1 overflow-y-auto">
              <SeguimientoPage
                casoId={selectedCaso.id}
                onDataChange={() => setRefreshKey(k => k + 1)}
                onCaseClosed={() => {
                  setSelectedCaso(null)
                  setRefreshKey(k => k + 1)
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
