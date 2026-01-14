import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getCase, updateCase, createFollowup } from '../api/db'
import { emitDataUpdated } from '../utils/refreshBus'
import { useSeguimientos } from '../hooks/useSeguimientos'
import SeguimientoForm from '../components/SeguimientoForm'
import { FileText } from 'lucide-react'
import SeguimientoItem from '../components/SeguimientoItem'
import ProcesoVisualizer from '../components/ProcesoVisualizer'
import InvolucradosList from '../components/InvolucradosList'
import { formatDate } from '../utils/formatDate'
import { useToast } from '../hooks/useToast'

export default function SeguimientoPage({
  casoId: casoIdProp,
  readOnly = false,
  showExport = false,
  onCaseClosed,
  onDataChange,
  // allow parent to hide the historial section when rendering layout blocks
  showHistorial = true,
  // when rendered inside the main grid, avoid `.container`
  embedded = false,
  // external control for the "nueva acción" modal
  externalMostrarForm, // boolean | undefined
  setExternalMostrarForm, // function | undefined
  // hide the in-component new-action button (we'll render it elsewhere)
  hideNewAction = false,
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
      <div className="p-4 sm:p-6 text-gray-500">
        No se ha seleccionado un caso.
      </div>
    )
  }

  if (loadingCaso) {
    return (
      <div className="p-4 sm:p-6 text-gray-500">
        Cargando caso…
      </div>
    )
  }

  if (!caso) {
    return (
      <div className="p-4 sm:p-6 text-red-600">
        No se pudo cargar el caso.
      </div>
    )
  }

  if (!caso.fields) {
    return (
      <div className="p-4 sm:p-6 text-red-600">
        Error: El caso no tiene campos definidos.
      </div>
    )
  }

  const esCerrado = caso.fields.Estado === 'Cerrado'
  const soloLectura = readOnly || esCerrado

  return (
    <div className={`${embedded ? 'w-full' : 'container'} p-4 sm:p-6 space-y-6`}>

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-3">
            <FileText size={20} className="text-blue-600" />
            Seguimiento del Caso
          </h1>
          <p className="text-sm text-gray-600">
            ID Caso <strong>{caso.fields.ID_Caso}</strong> · Estado{' '}
            <strong>{caso.fields.Estado}</strong>
          </p>
        </div>

        <div className="flex gap-2">
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
              className="btn-primary bg-blue-600 hover:bg-blue-700 px-4 py-2"
            >
              Exportar Informe
            </button>
          )}

          {/* + Nueva Acción ahora en el lugar del botón 'Volver' (puede estar controlado externamente) */}
          {!esCerrado && !soloLectura && !hideNewAction && (
            <button
              onClick={() => {
                if (typeof setExternalMostrarForm === 'function') setExternalMostrarForm(true)
                else setMostrarForm(true)
              }}
              className="px-3 py-2 text-sm border rounded hover:bg-gray-50 flex items-center"
            >
              <span className="text-green-600 mr-2">+</span>
              Nueva Acción
            </button>
          )}
        </div>
      </div>

      {!loadingCaso && caso?.fields && (
        <div className="space-y-4">

          <div className="rounded-xl border p-4 bg-gray-50">
            <div className="text-xs text-gray-500">Estudiante</div>
            <div className="text-lg font-bold text-gray-900">
              {caso.fields.Estudiante_Responsable || 'N/A'}
            </div>
            <div className="text-sm text-gray-600">
              Curso: {caso.fields.Curso_Incidente || 'N/A'}
            </div>
          </div>

          <div>
            <div className="text-xs font-extrabold text-slate-700">
              Descripción
            </div>
            <div className="text-slate-600 mt-1">
              {caso.fields.Descripcion || 'Sin descripción registrada.'}
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-gray-900 mb-2">
              Involucrados
            </div>
            <InvolucradosList casoId={casoId} readOnly />
          </div>

        </div>
      )}

      {/* Originalmente aquí estaba +NuevaAcción; ahora colocamos el botón Cerrar Caso */}
      {!soloLectura && !mostrarForm && (
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border-dashed border-gray-300 flex justify-center">
          <button
            onClick={cerrarCaso}
            className="btn-primary bg-green-600 hover:bg-green-700 px-6 py-3 text-sm font-semibold"
          >
            Cerrar Caso
          </button>
        </div>
      )}

      {showHistorial && (
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
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
      )}

      {/* El visualizador de proceso se muestra en la vista principal de `Seguimientos` (fila inferior). */}

      {/* MODAL */}
      {!soloLectura && ((typeof externalMostrarForm === 'boolean' ? externalMostrarForm : mostrarForm)) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="glass w-full max-w-lg p-6 relative">
            <button
              onClick={() => {
                if (typeof setExternalMostrarForm === 'function') setExternalMostrarForm(false)
                else setMostrarForm(false)
              }}
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
                if (typeof setExternalMostrarForm === 'function') setExternalMostrarForm(false)
                else setMostrarForm(false)
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
