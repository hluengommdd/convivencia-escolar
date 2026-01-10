import { useEffect, useState } from 'react'
import { getCases } from '../api/db'
import SeguimientoPage from './SeguimientoPage'
import { formatDate } from '../utils/formatDate'
import ProcesoVisualizer from '../components/ProcesoVisualizer'
import ControlDePlazos from './ControlDePlazos'
import { useSeguimientos } from '../hooks/useSeguimientos'
import { Menu, FileText, Clock, List, Plus } from 'lucide-react'

export default function Seguimientos() {
  const [casos, setCasos] = useState([])
  const [selectedCaso, setSelectedCaso] = useState(null)
  const [externalMostrarForm, setExternalMostrarForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [visualizerOpen, setVisualizerOpen] = useState(true)

    useEffect(() => {
      async function cargar() {
        try {
          setLoading(true)
          const data = await getCases()

          // SOLO CASOS EN SEGUIMIENTO (EXCLUYE CERRADOS)
          const enSeguimiento = data.filter(
            c => c.fields?.Estado && c.fields.Estado !== 'Cerrado'
          )

          setCasos(enSeguimiento)
        } catch (e) {
          console.error(e)
        } finally {
          setLoading(false)
        }
      }

      cargar()
    }, [refreshKey])

    // Seguimientos del caso seleccionado (para el visualizador global)
    const { data: casoSeguimientos = [], loading: loadingCasoSeg } = useSeguimientos(
      selectedCaso?.id || null,
      // re-evaluate when selectedCaso changes or refreshKey
      selectedCaso ? refreshKey : null
    )

  return (
    <div className="h-full">
      {/* Grid 2x2: top-left, top-right, bottom-left, bottom-right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full" style={{ gridTemplateRows: '1fr 1fr' }}>

        {/* Top-left: Casos en Seguimiento */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden h-full flex flex-col min-h-0">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Menu size={18} className="text-blue-600" />
                <h2 className="text-base font-semibold leading-tight">Casos en Seguimiento</h2>
              </div>
              <div className="flex items-center gap-2">
              </div>
            </div>
          </div>
          <div className="hidden sm:grid grid-cols-12 gap-2 px-4 sm:px-6 py-2 sm:py-3 text-sm font-semibold text-gray-500 border-b leading-tight">
            <div className="sm:col-span-1">#</div>
            <div className="sm:col-span-3">Fecha</div>
            <div className="sm:col-span-4">Estudiante</div>
            <div className="sm:col-span-2">Tipificación</div>
            <div className="sm:col-span-2">Estado</div>
          </div>
          <div className="flex-1 overflow-auto text-sm">
            {loading && <p className="p-4 sm:p-6 text-gray-500 text-sm">Cargando casos…</p>}
            {!loading && (
              <div className="divide-y divide-gray-100">
                {casos.map((caso, index) => (
                  <div
                    key={caso.id}
                    onClick={() => { setSelectedCaso(caso); setVisualizerOpen(true); }}
                    className={`grid grid-cols-1 sm:grid-cols-12 gap-2 px-4 sm:px-6 py-2 sm:py-3 text-sm leading-snug cursor-pointer hover:bg-gray-50
                        ${selectedCaso?.id === caso.id ? 'bg-slate-50 border-l-2 border-blue-300' : ''}`}
                  >
                    <div className="sm:col-span-1 text-gray-400">{index + 1}</div>
                    <div className="sm:col-span-3">
                      <p className="font-medium">{formatDate(caso.fields.Fecha_Incidente)}</p>
                      <p className="text-sm text-gray-400">{caso.fields.Hora_Incidente}</p>
                    </div>
                    <div className="sm:col-span-4 font-semibold truncate">{caso.fields.Estudiante_Responsable}</div>
                    <div className="sm:col-span-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        caso.fields.Tipificacion_Conducta === 'Leve' ? 'bg-green-100 text-green-800'
                        : caso.fields.Tipificacion_Conducta === 'Grave' ? 'bg-yellow-100 text-yellow-800'
                        : caso.fields.Tipificacion_Conducta === 'Muy Grave' ? 'bg-purple-100 text-purple-800'
                        : caso.fields.Tipificacion_Conducta === 'Gravísima' ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100'}
                      `}>
                        {caso.fields.Tipificacion_Conducta}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">{caso.fields.Estado}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top-right: Seguimiento del Caso (Resumen + Involucrados) */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 h-full flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <FileText size={18} className="text-green-600" />
              <h3 className="text-base font-semibold leading-tight">Seguimiento del Caso</h3>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setRefreshKey(k=>k+1) }} className="px-2 py-1 text-sm border rounded hover:bg-gray-50">Refrescar</button>
            </div>
          </div>
          <div className="flex-1 overflow-auto text-sm">
              {selectedCaso ? (
                <SeguimientoPage
                  casoId={selectedCaso.id}
                  onDataChange={() => setRefreshKey(k => k + 1)}
                  onCaseClosed={() => { setSelectedCaso(null); setRefreshKey(k => k + 1) }}
                  showHistorial={false}
                  embedded={true}
                  hideNewAction={true}
                  externalMostrarForm={externalMostrarForm}
                  setExternalMostrarForm={setExternalMostrarForm}
                />
              ) : (
                <div className="text-sm text-gray-500 p-4">Selecciona un caso para ver el seguimiento</div>
              )}
          </div>
        </div>

        {/* Bottom-left: Control de Plazos / Seguimientos (lista) */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 h-full flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-yellow-500" />
              <h3 className="text-base font-semibold leading-tight">Control de Plazos / Seguimientos</h3>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setRefreshKey(k=>k+1) }} className="px-2 py-1 text-sm border rounded hover:bg-gray-50">Refrescar</button>
              {selectedCaso && (
                <button
                  onClick={() => setExternalMostrarForm(true)}
                  className="ml-2 bg-red-600 hover:bg-red-700 text-white px-2 py-1 text-sm font-semibold rounded flex items-center gap-2"
                >
                  <Plus size={14} className="text-white" />
                  <span className="text-white">Nueva Acción</span>
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-auto text-sm">
            {selectedCaso ? (
              <ControlDePlazos casoId={selectedCaso.id} />
            ) : (
              <div className="text-sm text-gray-500 p-4">Selecciona un caso para ver las acciones</div>
            )}
          </div>
        </div>

        {/* Bottom-right: Debido Proceso (visualizador) */}
        <div id="proceso-visualizer-block" className="bg-white rounded-xl shadow-sm p-4 sm:p-6 h-full flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <List size={18} className="text-purple-600" />
              <h3 className="text-base font-semibold leading-tight">Progreso del Debido Proceso</h3>
            </div>
            <div className="text-sm text-gray-600">{casoSeguimientos.length} acciones</div>
          </div>
          <div className="flex-1 overflow-auto text-sm">
            {selectedCaso ? (
              <ProcesoVisualizer
                seguimientos={casoSeguimientos || []}
                fechaInicio={selectedCaso?.fields?.Fecha_Incidente || null}
                onSelectStep={(followupId) => {
                  try {
                    const el = document.getElementById(`seg-${followupId}`)
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  } catch (e) {
                    console.debug('scrollTo seg failed', e)
                  }
                }}
              />
            ) : (
              <div className="text-sm text-gray-500 p-4">Selecciona un caso para ver el progreso del debido proceso</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
