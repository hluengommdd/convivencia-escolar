import { Clock, Edit2, Save, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { updateCase } from '../api/db'
import { useState } from 'react'

export default function CaseDetailPanel({ caso }) {
  const navigate = useNavigate()
  const [editando, setEditando] = useState(false)
  const [descripcion, setDescripcion] = useState(caso.fields.Descripcion || '')
  const [guardando, setGuardando] = useState(false)

  async function iniciarSeguimiento() {
    try {
      // 1️⃣ Cambiar estado del caso
      await updateCase(caso.id, {
        Estado: 'En Seguimiento',
      })

      // 2️⃣ Ir a la página de seguimientos (SIN id)
      navigate('/seguimientos')
    } catch (e) {
      console.error(e)
      alert('Error al iniciar seguimiento')
    }
  }

  async function guardarDescripcion() {
    try {
      setGuardando(true)
      await updateCase(caso.id, {
        Descripcion: descripcion
      })
      
      // Actualizar el objeto caso localmente
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

  return (
    <div className="card h-full flex flex-col">
      {/* HEADER */}
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
                  className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                >
                  <Save size={14} />
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  onClick={cancelarEdicion}
                  disabled={guardando}
                  className="flex items-center gap-1 px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 disabled:opacity-50"
                >
                  <X size={14} />
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg break-words whitespace-pre-wrap">
              {caso.fields.Descripcion || 'Sin descripción'}
            </div>
          )}
        </div>

        <div className="flex items-center bg-gray-50 p-4 rounded-lg text-gray-600">
          <Clock size={18} className="mr-3" />
          <span>{caso.fields.Fecha_Incidente}</span>
          <span className="mx-2">·</span>
          <span>{caso.fields.Hora_Incidente}</span>
        </div>
      </div>

      {/* BOTÓN */}
      <div className="p-6 border-t bg-transparent">
        <button
          onClick={iniciarSeguimiento}
          className="btn-primary w-full"
        >
          Iniciar seguimiento
        </button>
      </div>
    </div>
  )
}
