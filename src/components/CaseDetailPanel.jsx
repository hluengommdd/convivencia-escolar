import { Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { updateRecord } from '../api/airtable'

export default function CaseDetailPanel({ caso }) {
  const navigate = useNavigate()

  async function iniciarSeguimiento() {
    try {
      // 1️⃣ Cambiar estado del caso
      await updateRecord('CASOS_ACTIVOS', caso.id, {
        Estado: 'En Seguimiento',
      })

      // 2️⃣ Ir a la página de seguimientos (SIN id)
      navigate('/seguimientos')
    } catch (e) {
      console.error(e)
      alert('Error al iniciar seguimiento')
    }
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-xl border">
      {/* HEADER */}
      <div
        className={`px-6 py-4 border-b ${
          caso.fields.Tipificacion_Conducta === 'Leve'
            ? 'bg-blue-50'
            : caso.fields.Tipificacion_Conducta === 'Grave'
            ? 'bg-yellow-50'
            : caso.fields.Tipificacion_Conducta === 'Muy Grave'
            ? 'bg-orange-50'
            : 'bg-red-50'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 text-sm font-semibold bg-white rounded-full">
            Caso Activo
          </span>

          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${
              caso.fields.Tipificacion_Conducta === 'Leve'
                ? 'bg-blue-100 text-blue-800'
                : caso.fields.Tipificacion_Conducta === 'Grave'
                ? 'bg-yellow-100 text-yellow-800'
                : caso.fields.Tipificacion_Conducta === 'Muy Grave'
                ? 'bg-orange-100 text-orange-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {caso.fields.Tipificacion_Conducta}
          </span>
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="flex-1 overflow-y-auto p-6">
        <h1 className="text-2xl font-bold mb-6">
          {caso.fields.Estudiante_Responsable}
        </h1>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 mb-1">
            Curso
          </h3>
          <p className="text-lg font-medium">
            {caso.fields.Curso_Incidente || '—'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-1">
              Tipo de falta
            </h3>
            <p>{caso.fields.Tipificacion_Conducta}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-1">
              Estado
            </h3>
            <span className="px-3 py-1 rounded-full text-sm bg-gray-100">
              {caso.fields.Estado}
            </span>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-500 mb-2">
            Descripción breve
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg break-words whitespace-pre-wrap">
            {caso.fields.Descripcion_Breve}
          </div>
        </div>

        <div className="flex items-center bg-gray-50 p-4 rounded-lg text-gray-600">
          <Clock size={18} className="mr-3" />
          <span>{caso.fields.Fecha_Incidente}</span>
          <span className="mx-2">·</span>
          <span>{caso.fields.Hora_Incidente}</span>
        </div>
      </div>

      {/* BOTÓN */}
      <div className="p-6 border-t bg-white">
        <button
          onClick={iniciarSeguimiento}
          className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700"
        >
          Iniciar seguimiento
        </button>
      </div>
    </div>
  )
}
