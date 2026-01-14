import { Edit2, Save, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { updateCase } from '../api/db'
import { useEffect, useMemo, useState } from 'react'
import InvolucradosListPlaceholder from './InvolucradosListPlaceholder'
import CaseStudentHeaderCard from './CaseStudentHeaderCard'
import { usePlazosResumen } from '../hooks/usePlazosResumen'

function vencimientoLabel(dias) {
  if (!Number.isFinite(dias)) return null
  if (dias < 0) return `Vencido ${Math.abs(dias)} día${Math.abs(dias) === 1 ? '' : 's'}`
  if (dias === 0) return 'Vence hoy'
  return `Vence en ${dias} día${dias === 1 ? '' : 's'}`
}

export default function CaseDetailPanel({ caso }) {
  const navigate = useNavigate()
  const [editando, setEditando] = useState(false)
  const [descripcion, setDescripcion] = useState(caso.fields.Descripcion || '')
  const [guardando, setGuardando] = useState(false)

  // ✅ plazos (vista resumen por case)
  const { row: plazoRow } = usePlazosResumen(caso.id, 0)
  const dias = plazoRow?.dias_restantes ?? null

  const overdueLabel = useMemo(() => vencimientoLabel(dias), [dias])
  const isOverdue = Number.isFinite(dias) && dias <= 0

  // ✅ lo que pediste: "Falta" (NO etapa)
  const falta =
    caso.fields.Categoria ||
    caso.fields.Falta ||
    caso.fields.Tipificacion_Conducta ||
    ''

  async function iniciarSeguimiento() {
    try {
      await updateCase(caso.id, { Estado: 'En Seguimiento' })
      // ✅ navegación correcta
      navigate(`/seguimientos/${caso.id}`)
    } catch (e) {
      console.error(e)
      alert('Error al iniciar seguimiento')
    }
  }

  async function verSeguimiento() {
    navigate(`/seguimientos/${caso.id}`)
  }

  async function guardarDescripcion() {
    try {
      setGuardando(true)
      await updateCase(caso.id, { Descripcion: descripcion })
      caso.fields.Descripcion = descripcion
      setEditando(false)
      alert('Descripción actualizada correctamente')
    } catch (e) {
      console.error(e)
      alert('Error al guardar la descripción')
    } finally {
      setGuardando(false)
    }
  }

  function cancelarEdicion() {
    setDescripcion(caso.fields.Descripcion || '')
    setEditando(false)
  }

  const estado = caso.fields.Estado || '—'

  return (
    <div className="bg-white rounded-xl shadow-sm h-full flex flex-col">
      {/* HEADER de chips "Caso Activo" (se mantiene como ya lo tienes) */}
      <div
        className={`px-6 py-4 border-b ${
          caso.fields.Tipificacion_Conducta === 'Leve'
            ? 'bg-green-50'
            : caso.fields.Tipificacion_Conducta === 'Grave'
            ? 'bg-yellow-50'
            : caso.fields.Tipificacion_Conducta === 'Muy Grave'
            ? 'bg-purple-50'
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
                ? 'bg-green-100 text-green-800'
                : caso.fields.Tipificacion_Conducta === 'Grave'
                ? 'bg-yellow-100 text-yellow-800'
                : caso.fields.Tipificacion_Conducta === 'Muy Grave'
                ? 'bg-purple-100 text-purple-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {caso.fields.Tipificacion_Conducta}
          </span>
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* ✅ Tarjeta estudiante estilo mock + vencimiento + falta */}
        <CaseStudentHeaderCard
          studentName={caso.fields.Estudiante_Responsable}
          course={caso.fields.Curso_Incidente || '—'}
          tipificacion={caso.fields.Tipificacion_Conducta || '—'}
          estado={caso.fields.Estado || '—'}
          falta={falta}
          isOverdue={isOverdue}
          overdueLabel={overdueLabel}
        />

        {/* Descripción */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-500">
              Descripción breve
            </h3>
            {!editando && (
              <button
                onClick={() => setEditando(true)}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <Edit2 size={14} />
                Editar
              </button>
            )}
          </div>

          {editando ? (
            <div className="space-y-2">
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full p-3 border rounded-lg min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Escribe la descripción del caso..."
              />
              <div className="flex gap-2">
                <button
                  onClick={guardarDescripcion}
                  disabled={guardando}
                  className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save size={14} />
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  onClick={cancelarEdicion}
                  disabled={guardando}
                  className="flex items-center gap-1 px-3 py-2 border rounded-lg hover:bg-gray-50"
                >
                  <X size={14} />
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-700 whitespace-pre-wrap">
              {caso.fields.Descripcion || 'Sin descripción'}
            </p>
          )}
        </div>

        {/* Fecha/Hora */}
        <div className="text-sm text-gray-600">
          <span>{caso.fields.Fecha_Incidente}</span>
          <span className="mx-2">·</span>
          <span>{caso.fields.Hora_Incidente}</span>
        </div>

        {/* Involucrados */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-500 mb-2">
            Involucrados
          </h3>
          <InvolucradosListPlaceholder casoId={caso.id} />
        </div>
      </div>

      {/* BOTÓN abajo */}
      <div className="p-6 border-t bg-transparent">
        {estado === 'En Seguimiento' ? (
          <button onClick={verSeguimiento} className="btn-primary w-full">
            Ver seguimiento
          </button>
        ) : (
          <button onClick={iniciarSeguimiento} className="btn-primary w-full">
            Iniciar seguimiento
          </button>
        )}
      </div>
    </div>
  )
}
