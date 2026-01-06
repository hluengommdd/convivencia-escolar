import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getCase, updateCase, createFollowup } from '../api/db'
import { emitDataUpdated } from '../utils/refreshBus'
import { useSeguimientos } from '../hooks/useSeguimientos'
import SeguimientoForm from '../components/SeguimientoForm'
import SeguimientoItem from '../components/SeguimientoItem'
import ProcesoVisualizer from '../components/ProcesoVisualizer'
import { formatDate } from '../utils/formatDate'
import { useToast } from '../hooks/useToast'

export default function SeguimientoPage({
  casoId: casoIdProp,
  readOnly = false,
  showExport = false,
  onCaseClosed,
  onDataChange,
}) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // PRIORIDAD: URL ?caso= → luego prop
  const casoId = searchParams.get('caso') || casoIdProp

  const [caso, setCaso] = useState(null)
  const [loadingCaso, setLoadingCaso] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [mostrarForm, setMostrarForm] = useState(false)
  const { push } = useToast()

  const { data: seguimientos, loading: loadingSeg } = useSeguimientos(
    casoId,
    refreshKey
  )

  useEffect(() => {
    if (!casoId) return

    async function cargarCaso() {
      try {
        setLoadingCaso(true)
        const record = await getCase(casoId)
        setCaso(record)
      } catch (e) {
        console.error(e)
        push({ type: 'error', title: 'Error cargando caso', message: e?.message || 'Fallo de red' })
      } finally {
        setLoadingCaso(false)
      }
    }

    cargarCaso()
  }, [casoId, push])

  async function cerrarCaso() {
    if (!confirm('¿Confirmar cierre del caso?')) return

    try {
      await updateCase(casoId, {
        Estado: 'Cerrado',
      })

      await createFollowup({
        Caso_ID: casoId,
        Fecha_Seguimiento: new Date().toISOString().slice(0, 10),
        Descripcion: 'Cierre formal del caso',
        Acciones: 'Caso cerrado',
      })

      push({ type: 'success', title: 'Caso cerrado', message: 'El caso se marcó como cerrado' })
      alert('Caso cerrado correctamente')
      emitDataUpdated()
      onDataChange?.()
      onCaseClosed?.(casoId)
      navigate(`/casos-cerrados?caso=${casoId}`)
      setRefreshKey(k => k + 1)
      setMostrarForm(false)
    } catch (e) {
      console.error(e)
      push({ type: 'error', title: 'No se pudo cerrar', message: e?.message || 'Intenta de nuevo' })
      alert('Error al cerrar el caso')
    }
  }

  if (!casoId) {
    return (
      <div className="p-6 text-gray-500">
        No se ha seleccionado un caso.
      </div>
    )
  }

  if (loadingCaso) {
    return (
      <div className="p-6 text-gray-500">
        Cargando caso…
      </div>
    )
  }

  if (!caso) {
    return (
      <div className="p-6 text-red-600">
        No se pudo cargar el caso.
      </div>
    )
  }

  if (!caso.fields) {
    return (
      <div className="p-6 text-red-600">
        Error: El caso no tiene campos definidos.
      </div>
    )
  }

  const esCerrado = caso.fields.Estado === 'Cerrado'
  const soloLectura = readOnly || esCerrado

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">
            Seguimiento del Caso
          </h1>
          <p className="text-sm text-gray-600">
            ID Caso <strong>{caso.fields.ID_Caso}</strong> · Estado{' '}
            <strong>{caso.fields.Estado}</strong>
          </p>
        </div>

        <div className="flex gap-2">
          {!soloLectura && (
            <button
              onClick={cerrarCaso}
              className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
            >
              Cerrar Caso
            </button>
          )}

          {showExport && (
            <button
              onClick={async () => {
                try {
                  const [{ pdf }, { default: InformeCasoDocument }] = await Promise.all([
                    import('@react-pdf/renderer'),
                    import('../components/InformeCasoDocument'),
                  ])

                  const doc = (
                    <InformeCasoDocument
                      caso={caso}
                      seguimientos={seguimientos || []}
                    />
                  )

                  const blob = await pdf(doc).toBlob()
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `Informe_Caso_${caso.fields?.ID_Caso || caso.id}.pdf`
                  document.body.appendChild(a)
                  a.click()
                  a.remove()
                  URL.revokeObjectURL(url)
                  push({ type: 'success', title: 'PDF listo', message: 'Informe generado' })
                } catch (e) {
                  console.error(e)
                  push({ type: 'error', title: 'Error al generar PDF', message: e?.message || 'Intenta de nuevo' })
                  alert('Error al generar PDF')
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Exportar Informe
            </button>
          )}

          {!esCerrado && (
            <button
              onClick={() =>
                navigate(
                  soloLectura
                    ? '/casos-cerrados'
                    : '/casos-activos'
                )
              }
              className="px-3 py-2 text-sm border rounded hover:bg-gray-50"
            >
              Volver
            </button>
          )}
        </div>
      </div>

      {/* RESUMEN */}
      <div className="bg-white border rounded-xl p-4 grid grid-cols-2 gap-4 text-sm">
        <p><strong>Estudiante:</strong> {caso.fields.Estudiante_Responsable || 'N/A'}</p>
        <p><strong>Curso:</strong> {caso.fields.Curso_Incidente || 'N/A'}</p>
        <p><strong>Fecha / Hora:</strong>{' '} {caso.fields.Fecha_Incidente ? formatDate(caso.fields.Fecha_Incidente) : 'N/A'} ·{' '} {caso.fields.Hora_Incidente || 'N/A'}</p>
        <p><strong>Tipificación:</strong> {caso.fields.Tipificacion_Conducta || 'N/A'}</p>
        <p><strong>Categoría:</strong> {caso.fields.Categoria || 'N/A'}</p>
        <p className="col-span-2"><strong>Descripción:</strong></p>
        <div className="col-span-2 break-words whitespace-pre-wrap text-sm">
          {caso.fields.Descripcion || 'Sin descripción'}
        </div>
      </div>

      {/* BOTÓN NUEVA ACCIÓN */}
      {!soloLectura && !mostrarForm && (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-4 flex justify-center">
          <button
            onClick={() => setMostrarForm(true)}
            className="px-6 py-3 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition"
          >
            + Nueva Acción
          </button>
        </div>
      )}

      {/* HISTORIAL DE SEGUIMIENTOS */}
      <div className="bg-white border rounded-xl p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Control de Plazos / Seguimientos
        </h2>

        {loadingSeg && (
          <p className="text-sm text-gray-500">
            Cargando seguimientos…
          </p>
        )}

        {!loadingSeg && (seguimientos || []).length === 0 && (
          <p className="text-sm text-gray-500">
            No hay acciones registradas.
          </p>
        )}

        <div className="space-y-4">
          {(seguimientos || []).map(seg => (
            <SeguimientoItem key={seg.id} seg={seg} readOnly={soloLectura} />
          ))}
        </div>
      </div>

      {/* VISUALIZADOR DE PROCESO */}
      <div className="bg-white border rounded-xl p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Progreso del Debido Proceso
        </h2>
        <ProcesoVisualizer 
          seguimientos={seguimientos || []} 
          fechaInicio={caso.fields.Fecha_Incidente || null}
        />
      </div>

      {/* MODAL */}
      {!soloLectura && mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl p-6 relative">
            <button
              onClick={() => setMostrarForm(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>

            <h2 className="text-lg font-semibold mb-4">
              Registrar nueva acción
            </h2>

            <SeguimientoForm
              casoId={casoId}
              onSaved={() => {
                setRefreshKey(k => k + 1)
                setMostrarForm(false)
                emitDataUpdated()
                onDataChange?.()
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
