import { useState } from 'react'
import { useAirtable } from '../hooks/useAirtable'
import SeguimientoPage from './SeguimientoPage'
import { formatDate } from '../utils/formatDate'

export default function CasosCerrados() {
  const {
    data: casos,
    loading,
    error,
  } = useAirtable(
    'CASOS_ACTIVOS',
    'Grid view',
    "Estado = 'Cerrado'"
  )

  const [selectedCaso, setSelectedCaso] = useState(null)

  if (loading) {
    return (
      <p className="text-gray-500">
        Cargando casos cerrados…
      </p>
    )
  }

  if (error) {
    return (
      <p className="text-red-500">
        Error: {error}
      </p>
    )
  }

  return (
    <div className="flex gap-6">
      {/* LISTA IZQUIERDA */}
      <div className="w-1/2 bg-white border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b">
          <h2 className="text-lg font-semibold">
            Casos Cerrados
          </h2>
        </div>

        {/* ENCABEZADO */}
        <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs font-semibold text-gray-500 border-b">
          <div className="col-span-1">#</div>
          <div className="col-span-3">Fecha</div>
          <div className="col-span-4">Estudiante</div>
          <div className="col-span-2">Tipificación</div>
          <div className="col-span-2">Estado</div>
        </div>

        {casos.length === 0 && (
          <p className="p-4 text-sm text-gray-500">
            No hay casos cerrados registrados.
          </p>
        )}

        {casos.map((caso, index) => (
          <div
            key={caso.id}
            onClick={() => setSelectedCaso(caso)}
            className={`grid grid-cols-12 gap-2 px-4 py-3 text-sm border-b cursor-pointer hover:bg-gray-50
              ${
                selectedCaso?.id === caso.id
                  ? 'bg-gray-100 border-l-4 border-gray-400'
                  : ''
              }`}
          >
            <div className="col-span-1 text-gray-400">
              {index + 1}
            </div>

            <div className="col-span-3">
              <p className="font-medium">
               {formatDate(caso.fields.Fecha_Incidente)}
              </p>
              <p className="text-xs text-gray-400">
                {caso.fields.Hora_Incidente}
              </p>
            </div>

            <div className="col-span-4 font-semibold truncate">
              {caso.fields.Estudiante_Responsable}
            </div>

            <div className="col-span-2">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium
                  ${
                    caso.fields.Tipificacion_Conducta === 'Leve'
                      ? 'bg-blue-100 text-blue-800'
                      : caso.fields.Tipificacion_Conducta === 'Muy Grave'
                      ? 'bg-orange-100 text-orange-800'
                      : caso.fields.Tipificacion_Conducta === 'Gravísima'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100'
                  }`}
              >
                {caso.fields.Tipificacion_Conducta}
              </span>
            </div>

            <div className="col-span-2">
              <span className="px-2 py-1 rounded-full text-xs bg-gray-200 text-gray-700">
                Cerrado
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* PANEL DERECHO */}
      <div className="flex-1 bg-white border rounded-xl">
        {!selectedCaso && (
          <div className="h-full flex items-center justify-center text-gray-400">
            Selecciona un caso cerrado para ver el informe
          </div>
        )}

        {selectedCaso && (
          <SeguimientoPage
            casoId={selectedCaso.id}
            readOnly
            showExport
          />
        )}
      </div>
    </div>
  )
}
