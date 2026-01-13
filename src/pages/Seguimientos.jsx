import { useEffect, useState } from 'react'
import { getCases } from '../api/db'
import SeguimientoPage from './SeguimientoPage'
import { formatDate } from '../utils/formatDate'
import ProcesoVisualizer from '../components/ProcesoVisualizer'
import ControlDePlazos from './ControlDePlazos'
import { useSeguimientos } from '../hooks/useSeguimientos'
import { Menu, List } from 'lucide-react'

export default function Seguimientos() {
  const [casos, setCasos] = useState([])
  const [selectedCaso, setSelectedCaso] = useState(null)
  const [externalMostrarForm, setExternalMostrarForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [visualizerOpen, setVisualizerOpen] = useState(true)
  const doRefresh = () => setRefreshKey(k => k + 1)

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">

        {/* LEFT COLUMN - principal */}
        <div className="flex flex-col gap-6 h-full">
          {/* Casos list (selección) */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden h-1/3 flex flex-col min-h-0">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b">
              <div className="flex items-center gap-3">
                <Menu size={18} className="text-blue-600" />
                <h2 className="text-base font-semibold leading-tight">Casos en Seguimiento</h2>
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

          {/* Header del Caso (principal) */}
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
            {selectedCaso ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-xl font-semibold text-blue-700">
                    {selectedCaso.fields.Estudiante_Responsable ? selectedCaso.fields.Estudiante_Responsable.split(' ').map(n=>n[0]).slice(0,2).join('') : 'E'}
                  </div>
                  <div>
                    <div className="text-lg font-bold">{selectedCaso.fields.Estudiante_Responsable}</div>
                    <div className="text-sm text-gray-600">{selectedCaso.fields.Curso_Incidente}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{selectedCaso.fields.Tipificacion_Conducta}</span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">{selectedCaso.fields.Estado}</span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700">{selectedCaso.fields.Fecha_Incidente ? formatDate(selectedCaso.fields.Fecha_Incidente) : ''}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    onClick={() => setExternalMostrarForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow-sm hover:bg-blue-700"
                  >
                    + Registrar acción
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">Selecciona un caso para ver sus detalles</div>
            )}
          </div>

          {/* Progreso del Debido Proceso (principal) */}
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 flex-1 overflow-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <List size={18} className="text-purple-600" />
                <h3 className="text-base font-semibold leading-tight">Progreso del Debido Proceso</h3>
              </div>
              <div className="text-sm text-gray-600">{casoSeguimientos.length} acciones</div>
            </div>

            {selectedCaso ? (
              <div className="space-y-6">
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

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Acciones / Seguimientos</h4>
                  <div className="text-sm">
                    <ControlDePlazos casoId={selectedCaso.id} refreshKey={refreshKey} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500 p-4">Selecciona un caso para ver el progreso y acciones</div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN - contexto */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 h-full flex flex-col min-h-0">
          {/* Detalles compactos */}
          <div className="mb-4">
            <div className="text-sm font-semibold text-gray-700 mb-2">Detalles del Caso</div>
            {selectedCaso ? (
              <div className="bg-gray-50 p-3 rounded-md text-sm space-y-2">
                <div><strong>ID:</strong> {selectedCaso.fields.ID_Caso || selectedCaso.id}</div>
                <div><strong>Estudiante:</strong> {selectedCaso.fields.Estudiante_Responsable}</div>
                <div><strong>Curso:</strong> {selectedCaso.fields.Curso_Incidente}</div>
                <div><strong>Tipificación:</strong> {selectedCaso.fields.Tipificacion_Conducta}</div>
                <div><strong>Estado:</strong> {selectedCaso.fields.Estado}</div>
                <div><strong>Fecha incidente:</strong> {selectedCaso.fields.Fecha_Incidente ? formatDate(selectedCaso.fields.Fecha_Incidente) : 'N/A'}</div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">Selecciona un caso para ver detalles</div>
            )}
          </div>

          {/* ProcesoVisualizer compacto */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-gray-700">Progreso</div>
            </div>
            {selectedCaso ? (
              <ProcesoVisualizer compact seguimientos={casoSeguimientos || []} fechaInicio={selectedCaso?.fields?.Fecha_Incidente || null} />
            ) : (
              <div className="text-sm text-gray-500">Selecciona un caso para ver el progreso</div>
            )}
          </div>

          {/* Embedded SeguimientoPage (sin header/resumen) para export/modal/cerrar caso */}
          <div className="flex-1 overflow-auto">
            {selectedCaso ? (
              <SeguimientoPage
                casoId={selectedCaso.id}
                onDataChange={doRefresh}
                onCaseClosed={() => { setSelectedCaso(null); doRefresh() }}
                showHistorial={false}
                embedded={true}
                hideNewAction={true}
                externalMostrarForm={externalMostrarForm}
                setExternalMostrarForm={setExternalMostrarForm}
                hideHeader={true}
                hideResumen={true}
              />
            ) : (
              <div className="text-sm text-gray-500 p-4">Selecciona un caso para opciones avanzadas</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
