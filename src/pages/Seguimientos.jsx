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
  const doRefresh = () => setRefreshKey(k => k + 1)

    useEffect(() => {
      async function cargar() {
        try {
          setLoading(true)
          const data = await getCases()

          // SOLO CASOS EN SEGUIMIENTO (EXCLUYE CERRADOS)
          const enSeguimiento = data.filter(
            return (
              <div className="h-full">
                {/* Layout: 3 columnas en desktop (navegación / contenido / contexto) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">

                  {/* Columna izquierda: Lista de Casos (navegación) */}
                  <aside className="bg-white rounded-xl shadow-sm overflow-hidden h-full flex flex-col min-h-0">
                    <div className="px-4 sm:px-6 py-3 sm:py-4 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Menu size={18} className="text-blue-600" />
                          <h2 className="text-base font-semibold leading-tight">Casos en Seguimiento</h2>
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
                  </aside>
          setLoading(false)
                  {/* Columna central: Contenido principal (header + timeline) */}
                  <main className="h-full flex flex-col">
                    <div className="sticky top-4 z-10 bg-white p-4 sm:p-6 rounded-xl shadow-sm">
                      {selectedCaso ? (
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <h1 className="text-lg font-bold">{selectedCaso.fields.Estudiante_Responsable}</h1>
                            <p className="text-sm text-gray-600">{selectedCaso.fields.Curso_Incidente || 'Sin curso'}</p>
                            <div className="mt-2 flex items-center gap-2">
                              <span className="px-2 py-1 rounded-full text-sm bg-gray-100">{selectedCaso.fields.Tipificacion_Conducta}</span>
                              <span className="px-2 py-1 rounded-full text-sm bg-gray-100">{selectedCaso.fields.Estado}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {selectedCaso?.fields?.Fecha_Plazo && (
                              <div className="text-sm text-gray-500">Próximo plazo: <strong>{selectedCaso.fields.Fecha_Plazo}</strong></div>
                            )}
                            {selectedCaso && (
                              <button
                                onClick={() => setExternalMostrarForm(true)}
                                className="ml-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 text-sm font-semibold rounded flex items-center gap-2"
                              >
                                <Plus size={14} className="text-white" />
                                Nueva Acción
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">Selecciona un caso para ver y añadir acciones</div>
                      )}
                    </div>

                    <div className="flex-1 overflow-auto mt-4">
                      <div className="space-y-4">
                        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
                          <h3 className="text-base font-semibold mb-3">Timeline — Seguimientos</h3>
                          <div className="space-y-3">
                            {selectedCaso ? (
                              <ControlDePlazos casoId={selectedCaso.id} refreshKey={refreshKey} />
                            ) : (
                              <div className="text-sm text-gray-500 p-4">Selecciona un caso para ver las acciones</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </main>

                  {/* Columna derecha: Contexto y visualizador (secundario) */}
                  <aside className="h-full flex flex-col gap-4">
                    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <FileText size={18} className="text-green-600" />
                          <h3 className="text-base font-semibold leading-tight">Seguimiento del Caso</h3>
                        </div>
                      </div>
                      <div className="text-sm text-gray-700">
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
                          />
                        ) : (
                          <div className="text-sm text-gray-500 p-4">Selecciona un caso para ver el seguimiento</div>
                        )}
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 flex-1 overflow-auto">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <List size={18} className="text-purple-600" />
                          <h3 className="text-base font-semibold leading-tight">Progreso del Debido Proceso</h3>
                        </div>
                        <div>
                          <button
                            onClick={() => setVisualizerOpen(v => !v)}
                            className="text-sm text-gray-600 hover:underline"
                          >{visualizerOpen ? 'Ocultar' : 'Mostrar'}</button>
                        </div>
                      </div>
                      <div className="flex-1">
                        {selectedCaso && visualizerOpen ? (
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
                  </aside>
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
