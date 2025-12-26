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
        <div className="flex justify-between items-center">
          <p className="font-semibold text-sm">
            {seg.fields?.Tipo_Accion}
          </p>

          <span
            className={`text-xs px-2 py-1 rounded-full ${
              estadoColor[seg.fields?.Estado_Etapa] || 'bg-gray-100 text-gray-700'
            }`}
          >
            {seg.fields?.Estado_Etapa}
          </span>
        </div>

        <p className="text-xs text-gray-500 mt-1">
          {formatDate(seg.fields?.Fecha)} · Responsable:{' '}
          {seg.fields?.Responsable || '—'}
        </p>

        {seg.fields?.Detalle && (
          <p className="text-sm text-gray-700 mt-2">
            {seg.fields.Detalle}
          </p>
        )}

        {seg.fields?.Observaciones && (
          <p className="text-xs text-gray-500 mt-1">
            {seg.fields.Observaciones}
          </p>
        )}
      </div>
    </div>
  )
}
