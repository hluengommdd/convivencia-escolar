import { formatDate } from '../utils/formatDate'

export default function SeguimientoItem({ seg }) {
  const estadoColor = {
    Pendiente: 'bg-yellow-100 text-yellow-800',
    'En Proceso': 'bg-blue-100 text-blue-800',
    Completada: 'bg-green-100 text-green-800',
  }

  return (
    <div className="relative pl-6">
      {/* Línea vertical */}
      <div className="absolute left-2 top-0 h-full w-px bg-gray-200" />

      {/* Punto */}
      <div className="absolute left-1.5 top-2 w-3 h-3 rounded-full bg-blue-500" />

      <div className="bg-white border rounded-lg p-4">
        <div className="flex justify-between items-start">
          <p className="text-base font-bold text-gray-900">
            {seg.fields?.Tipo_Accion}
          </p>

          <span
            className={`text-xs px-2 py-1 rounded-full font-semibold ${
              estadoColor[seg.fields?.Estado_Etapa] || 'bg-gray-100 text-gray-700'
            }`}
          >
            {seg.fields?.Estado_Etapa}
          </span>
        </div>

        <p className="text-sm text-gray-600 mt-2">
          <strong>Fecha:</strong> {formatDate(seg.fields?.Fecha)} · <strong>Responsable:</strong>{' '}
          {seg.fields?.Responsable || '—'}
        </p>

        {seg.fields?.Detalle && (
          <p className="text-sm text-gray-700 mt-2 break-words whitespace-pre-wrap">
            {seg.fields.Detalle}
          </p>
        )}

        {seg.fields?.Observaciones && (
          <p className="text-sm text-gray-600 mt-2 italic break-words whitespace-pre-wrap">
            {seg.fields.Observaciones}
          </p>
        )}
      </div>
    </div>
  )
}
