import { Edit2, Save, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { updateCase, iniciarDebidoProceso, getCase } from '../api/db'
import { useState } from 'react'
import InvolucradosListPlaceholder from './InvolucradosListPlaceholder'
import CaseStudentHeaderCard from './CaseStudentHeaderCard'
import { emitDataUpdated } from '../utils/refreshBus'

export default function CaseDetailPanel({ caso, setRefreshKey, onDataChange }) {
  const navigate = useNavigate()
  const [editando, setEditando] = useState(false)
  const [descripcion, setDescripcion] = useState(caso.fields.Descripcion || '')
  const [guardando, setGuardando] = useState(false)

  // ✅ En Casos Activos NO mostramos SLA
  // La falta es el texto de la conducta
  const falta =
    caso.fields.Categoria ||
    caso.fields.Falta ||
    caso.fields.Tipificacion_Conducta ||
    ''

  // Calcular días desde creación para información contextual
  const diasDesdeCreacion = caso.fields.Fecha_Creacion 
    ? Math.floor((new Date() - new Date(caso.fields.Fecha_Creacion)) / (1000 * 60 * 60 * 24))
    : null

  async function handleIniciarDebidoProceso(e) {
    e?.stopPropagation()
    try {
      console.log('🚀 Iniciando debido proceso para caso:', caso.id)
      console.log('Estado actual:', caso.fields?.Estado)
      
      await iniciarDebidoProceso(caso.id, 10)
      
      console.log('✅ Debido proceso iniciado correctamente en BD')
      
      // ✅ Emitir evento para refrescar listados GLOBALMENTE
      emitDataUpdated()

      // ✅ NUEVO: forzar refresh reactivo (listado + paneles que dependan de refreshKey)
      setRefreshKey?.(k => k + 1)
      onDataChange?.()
      
      // ⏳ Delay para que Supabase actualice
      console.log('⏳ Esperando 2 segundos para que Supabase actualice...')
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // ✅ Refrescar el caso local para actualizar el estado mostrado ANTES de navegar
      console.log('🔄 Refrescando caso antes de navegar...')
      try {
        const casoActualizado = await getCase(caso.id)
        if (casoActualizado) {
          console.log('✅ Estado después de actualizar:', casoActualizado.fields?.Estado)
        }
      } catch (refreshErr) {
        console.warn('⚠️ No se pudo refrescar el caso localmente:', refreshErr)
      }
      
      // ✅ Navegar - Seguimientos harará su propio getCase() cuando arrive
      console.log('📍 Navegando a seguimientos con caso_id:', caso.id)
      navigate(`/seguimientos/${caso.id}`)
      
      // ⏳ Un delay más DESPUÉS de navegar para que Seguimientos.jsx tenga tiempo de cargar
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (err) {
      console.error('❌ Error iniciando debido proceso:', err)
      const errorMsg = err?.message || 'Error iniciando debido proceso'
      alert(`Error: ${errorMsg}\n\nAsegúrate de que:\n1. El caso exista en la base de datos\n2. La RPC start_due_process esté creada\n3. Tengas permisos para ejecutar la operación`)
    }
  }

  async function verSeguimiento() {
    // NO debe iniciar nada, solo navega
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
      {/* HEADER: No se muestra en Casos Activos */}
      <div className="hidden"></div>

      {/* CONTENIDO */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Tarjeta estudiante (sin SLA en Casos Activos) */}
        <CaseStudentHeaderCard
          studentName={caso.fields.Estudiante_Responsable}
          course={caso.fields.Curso_Incidente || '—'}
          tipificacion={caso.fields.Tipificacion_Conducta || '—'}
          estado={caso.fields.Estado || '—'}
          falta={falta}
          // En Casos Activos no se muestra SLA
          isOverdue={false}
          overdueLabel={null}
          isPendingStart={!caso._supabaseData?.seguimiento_started_at}
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
          {diasDesdeCreacion !== null && (
            <>
              <span className="mx-2">·</span>
              <span className="text-gray-500">
                Creado hace {diasDesdeCreacion} {diasDesdeCreacion === 1 ? 'día' : 'días'}
              </span>
            </>
          )}
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
      <div className="p-4 sm:p-6 border-t bg-transparent">
        {caso._supabaseData?.seguimiento_started_at ? (
          <button onClick={verSeguimiento} className="px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold w-full hover:bg-green-700 transition">
            Iniciar debido proceso
          </button>
        ) : (
          <button 
            onClick={handleIniciarDebidoProceso} 
            className="px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold w-full hover:bg-green-700 transition"
          >
            Iniciar debido proceso
          </button>
        )}
      </div>
    </div>
  )
}
