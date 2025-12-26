import { useEffect, useState } from 'react'
import { getRecords } from '../api/airtable'
import SeguimientoPage from './SeguimientoPage'
import { formatDate } from '../utils/formatDate'

export default function Seguimientos() {
  const [casos, setCasos] = useState([])
  const [selectedCaso, setSelectedCaso] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      try {
        setLoading(true)
        const data = await getRecords('CASOS_ACTIVOS')

        // ✅ SOLO CASOS EN SEGUIMIENTO (EXCLUYE CERRADOS)
        const enSeguimiento = data.filter(
          c => c.fields?.Estado && c.fields.Estado !== 'Cerrado'
        )

        setCasos(enSeguimiento)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }

    cargar()
  }, [])

  return (
    <div className="flex gap-6">
      {/* LISTA IZQUIERDA */}
      <div className="w-1/2 bg-white border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b">
          <h2 className="text-lg font-semibold">
            Casos en Seguimiento
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

        {loading && (
          <p className="p-4 text-gray-500 text-sm">
            Cargando casos…
          </p>
        )}

        {!loading &&
          casos.map((caso, index) => (
            <div
              key={caso.id}
              onClick={() => setSelectedCaso(caso)}
              className={`grid grid-cols-12 gap-2 px-4 py-3 text-sm border-b cursor-pointer hover:bg-gray-50
                ${
                  selectedCaso?.id === caso.id
                    ? 'bg-blue-50 border-l-4 border-blue-500'
                    : ''
                }`}
            >
              {/* Nº */}
              <div className="col-span-1 text-gray-400">
                {index + 1}
              </div>

              {/* Fecha */}
              <div className="col-span-3">
                <p className="font-medium">
                 {formatDate(caso.fields.Fecha_Incidente)}
              </p>
                <p className="text-xs text-gray-400">
               {caso.fields.Hora_Incidente}
              </p>
              </div>

              {/* Estudiante */}
              <div className="col-span-4 font-semibold truncate">
                {caso.fields.Estudiante_Responsable}
              </div>

              {/* Tipificación */}
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

              {/* Estado */}
              <div className="col-span-2">
                <span
                  className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                >
                  {caso.fields.Estado}
                </span>
              </div>
            </div>
          ))}
      </div>

      {/* PANEL DERECHO */}
      <div className="flex-1 bg-white border rounded-xl">
        {!selectedCaso && (
          <div className="h-full flex items-center justify-center text-gray-400">
            Selecciona un caso para ver el seguimiento
          </div>
        )}

        {selectedCaso && (
          <SeguimientoPage casoId={selectedCaso.id} />
        )}
      </div>
    </div>
  )
}
