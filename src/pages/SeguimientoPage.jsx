import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getRecord, updateRecord, createRecord } from '../api/airtable'
import { useSeguimientos } from '../hooks/useSeguimientos'
import SeguimientoForm from '../components/SeguimientoForm'
import SeguimientoItem from '../components/SeguimientoItem'
import InformeCasoPDF from '../components/InformeCasoPDF'
import InformeCasoDocument from '../components/InformeCasoDocument'
import ProcesoVisualizer from '../components/ProcesoVisualizer'
import { pdf } from '@react-pdf/renderer'
import { formatDate } from '../utils/formatDate'

export default function SeguimientoPage({
  casoId: casoIdProp,
  readOnly = false,
  showExport = false,
}) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // PRIORIDAD: URL ?caso= → luego prop
  const casoId = searchParams.get('caso') || casoIdProp

  const [caso, setCaso] = useState(null)
  const [loadingCaso, setLoadingCaso] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [mostrarForm, setMostrarForm] = useState(false)

  // 👉 ESTADO SOLO PARA PDF
  const [mostrarPDF, setMostrarPDF] = useState(false)

  const { data: seguimientos, loading: loadingSeg } = useSeguimientos(
    casoId,
    refreshKey
  )

  useEffect(() => {
    if (!casoId) return

    async function cargarCaso() {
      try {
        setLoadingCaso(true)
        const record = await getRecord('CASOS_ACTIVOS', casoId)
        setCaso(record)
      } catch (e) {
        console.error(e)
      } finally {
        setLoadingCaso(false)
      }
    }

    cargarCaso()
  }, [casoId])

  async function cerrarCaso() {
    if (!confirm('¿Confirmar cierre del caso?')) return

    try {
      await updateRecord('CASOS_ACTIVOS', casoId, {
        Estado: 'Cerrado',
      })

      await createRecord('SEGUIMIENTOS', {
        Fecha: new Date().toISOString().slice(0, 10),
        Tipo_Accion: 'Resolución',
        Etapa_Debido_Proceso: '6. Resolución y Sanciones',
        Estado_Etapa: 'Completada',
        Responsable: 'Encargado Convivencia',
        Detalle: 'Cierre formal del caso',
        CASOS_ACTIVOS: [casoId],
      })

      alert('Caso cerrado correctamente')
      setRefreshKey(k => k + 1)
      setMostrarForm(false)
    } catch (e) {
      console.error(e)
      alert('Error al cerrar el caso')
    }
  }

  /* =========================
     👉 PDF: RENDER EXCLUSIVO
  ========================== */
  if (mostrarPDF && caso) {
    return (
      <InformeCasoPDF
        caso={caso}
        seguimientos={seguimientos || []}
      />
    )
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
                } catch (e) {
                  console.error(e)
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
        <p><strong>Categoría:</strong> {caso.fields.Categoria_Conducta || 'N/A'}</p>
        <p className="col-span-2"><strong>Descripción:</strong></p>
        <div className="col-span-2 break-words whitespace-pre-wrap text-sm">
          {caso.fields.Descripcion_Breve || 'Sin descripción'}
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
            <SeguimientoItem key={seg.id} seg={seg} />
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
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
