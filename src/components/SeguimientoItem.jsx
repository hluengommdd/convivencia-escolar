import { useEffect, useState } from 'react'
import { formatDate } from '../utils/formatDate'
import {
  deleteEvidence,
  getEvidenceSignedUrl,
  listEvidenceByFollowup,
} from '../api/evidence'
import { useToast } from '../hooks/useToast'

export default function SeguimientoItem({ seg, readOnly = false }) {
  const estadoColor = {
    Pendiente: 'bg-yellow-100 text-yellow-800',
    'En Proceso': 'bg-blue-100 text-blue-800',
    Completada: 'bg-green-100 text-green-800',
  }

  const [evidencias, setEvidencias] = useState([])
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const { push } = useToast()

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        const data = await listEvidenceByFollowup(seg.id)
        if (!cancelled) setEvidencias(data)
      } catch (e) {
        if (!cancelled) {
          push({ type: 'error', title: 'Error al cargar evidencias', message: e?.message || 'Intenta de nuevo' })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [seg.id, push])

  async function handleOpen(row) {
    try {
      const url = await getEvidenceSignedUrl(row.storage_path)
      window.open(url, '_blank')
    } catch (e) {
      push({ type: 'error', title: 'No se pudo abrir', message: e?.message || 'Intenta de nuevo' })
    }
  }

  async function handleDelete(row) {
    if (readOnly) return
    if (!confirm('¿Eliminar esta evidencia?')) return
    try {
      setDeletingId(row.id)
      await deleteEvidence(row)
      setEvidencias(prev => prev.filter(ev => ev.id !== row.id))
      push({ type: 'success', title: 'Evidencia eliminada', message: row.file_name })
    } catch (e) {
      push({ type: 'error', title: 'No se pudo eliminar', message: e?.message || 'Intenta de nuevo' })
    } finally {
      setDeletingId(null)
    }
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

        <div className="mt-3 space-y-2">
          <p className="text-xs font-semibold text-gray-700">Evidencias</p>
          {loading && <p className="text-xs text-gray-500">Cargando evidencias…</p>}
          {!loading && evidencias.length === 0 && (
            <p className="text-xs text-gray-500">Sin archivos adjuntos.</p>
          )}
          {!loading && evidencias.length > 0 && (
            <ul className="space-y-2">
              {evidencias.map(row => (
                <li
                  key={row.id}
                  className="flex items-center justify-between text-sm bg-gray-50 border rounded px-3 py-2"
                >
                  <div className="truncate">
                    <p className="font-medium text-gray-800 truncate">{row.file_name}</p>
                    <p className="text-xs text-gray-500">
                      {(row.file_size ? row.file_size / 1024 : 0).toFixed(1)} KB
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpen(row)}
                      className="text-blue-600 text-xs hover:underline"
                    >
                      Ver
                    </button>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => handleDelete(row)}
                        disabled={deletingId === row.id}
                        className="text-red-600 text-xs hover:underline disabled:opacity-50"
                      >
                        {deletingId === row.id ? 'Eliminando…' : 'Eliminar'}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
