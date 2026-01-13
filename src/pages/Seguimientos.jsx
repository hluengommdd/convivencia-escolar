import { useEffect, useMemo, useState } from 'react'
import { getCases } from '../api/db'
import SeguimientoPage from './SeguimientoPage'
import { formatDate } from '../utils/formatDate'
import ProcesoVisualizer from '../components/ProcesoVisualizer'
import ControlDePlazos from './ControlDePlazos'
import { useSeguimientos } from '../hooks/useSeguimientos'
import { Menu, FileText, Clock, List, Plus, ChevronDown, ChevronUp } from 'lucide-react'

export default function Seguimientos() {
  const [casos, setCasos] = useState([])
  const [selectedCaso, setSelectedCaso] = useState(null)
  const [externalMostrarForm, setExternalMostrarForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [visualizerOpen, setVisualizerOpen] = useState(true)
  const [detailsOpen, setDetailsOpen] = useState(true)
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

  const headerInfo = useMemo(() => {
    if (!selectedCaso) return null
    const estudiante = selectedCaso.fields?.Estudiante_Responsable || 'Sin estudiante'
    const curso = selectedCaso.fields?.Curso || selectedCaso.fields?.Curso_Academico || 'Curso no indicado'
    const tipificacion = selectedCaso.fields?.Tipificacion_Conducta || 'Sin tipificación'
    const estado = selectedCaso.fields?.Estado || 'En seguimiento'
    const incidenteFecha = selectedCaso.fields?.Fecha_Incidente
    const diasDesde = incidenteFecha
      ? Math.max(0, Math.floor((Date.now() - new Date(incidenteFecha)) / (1000 * 60 * 60 * 24)))
      : null

    return { estudiante, curso, tipificacion, estado, incidenteFecha, diasDesde }
  }, [selectedCaso])

  return (
    <div className="h-full">
      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6 h-full">
        {/* Columna izquierda (principal) */}
        <div className="flex flex-col gap-4 min-h-0">
          {/* Header del caso compacto */}
          <div className="sticky top-0 z-20">
            {headerInfo ? (
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 text-white rounded-2xl shadow-lg p-4 sm:p-5 flex flex-wrap items-start justify-between gap-4 max-h-[112px]">
                <div className="flex items-center gap-3 min-w-[220px]">
                  <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-base font-semibold">
                    {headerInfo.estudiante?.[0] || 'E'}
                  </div>
                  <div>
                    <div className="text-xs text-slate-200">Estudiante</div>
                    <div className="text-lg font-semibold leading-tight">{headerInfo.estudiante}</div>
                    <div className="text-xs text-slate-300">{headerInfo.curso}</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                  <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 font-medium">
                    {headerInfo.tipificacion}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-50 border border-emerald-400/30 font-medium">
                    {headerInfo.estado}
                  </span>
                  {headerInfo.diasDesde !== null && (
                    <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 font-medium">
                      {headerInfo.diasDesde === 0 ? 'Hoy' : `${headerInfo.diasDesde} días desde incidente`}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExternalMostrarForm(true)}
                    className="inline-flex items-center gap-2 bg-white text-slate-900 font-semibold px-3 py-2 rounded-xl shadow hover:shadow-md transition text-sm"
                  >
                    <Plus size={14} />
                    Nueva Acción
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
                <div className="flex items-center gap-3 text-slate-600">
                  <FileText size={18} className="text-blue-600" />
                  <div>
                    <div className="font-semibold text-slate-900">Selecciona un caso</div>
                    <div className="text-sm text-slate-500">Elige un caso para ver sus seguimientos y detalles.</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Lista de casos (navegación secundaria) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col min-h-0">
            <div className="px-4 sm:px-6 py-3 sm:py-3 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Menu size={14} className="text-blue-600" />
                <h2 className="text-sm font-semibold leading-tight text-slate-800">Casos en seguimiento</h2>
              </div>
            </div>
            <div className="hidden sm:grid grid-cols-12 gap-2 px-4 sm:px-6 py-2 text-xs font-semibold text-gray-500 border-b leading-tight">
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
                      onClick={() => { setSelectedCaso(caso); setVisualizerOpen(true); setDetailsOpen(true); }}
                      className={`grid grid-cols-1 sm:grid-cols-12 gap-2 px-4 sm:px-6 py-2 sm:py-3 text-sm leading-snug cursor-pointer hover:bg-slate-50 transition
                        ${selectedCaso?.id === caso.id ? 'bg-slate-50 border-l-2 border-blue-300' : ''}`}
                    >
                      <div className="sm:col-span-1 text-gray-400">{index + 1}</div>
                      <div className="sm:col-span-3">
                        <p className="font-medium">{formatDate(caso.fields.Fecha_Incidente)}</p>
                        <p className="text-sm text-gray-400">{caso.fields.Hora_Incidente}</p>
                      </div>
                      <div className="sm:col-span-4 font-semibold truncate">{caso.fields.Estudiante_Responsable}</div>
                      <div className="sm:col-span-2">
                        <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                          caso.fields.Tipificacion_Conducta === 'Leve' ? 'bg-green-100 text-green-800'
                          : caso.fields.Tipificacion_Conducta === 'Grave' ? 'bg-yellow-100 text-yellow-800'
                          : caso.fields.Tipificacion_Conducta === 'Muy Grave' ? 'bg-purple-100 text-purple-800'
                          : caso.fields.Tipificacion_Conducta === 'Gravísima' ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-700'}
                        `}>
                          {caso.fields.Tipificacion_Conducta}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-semibold bg-emerald-100 text-emerald-800">{caso.fields.Estado}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Línea de seguimientos (foco principal) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-yellow-500" />
                <h3 className="text-base font-semibold leading-tight">Línea de Seguimientos</h3>
              </div>
            </div>

            <div className="flex-1 overflow-auto text-sm">
              {selectedCaso ? (
                <div className="space-y-5">
                  <ControlDePlazos casoId={selectedCaso.id} refreshKey={refreshKey} />
                </div>
              ) : (
                <div className="text-sm text-gray-500 p-4">Selecciona un caso para ver las acciones</div>
              )}
            </div>
          </div>

          {/* Seguimiento detallado embebido */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6 flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={16} className="text-green-600" />
              <h3 className="text-base font-semibold leading-tight">Detalle y acciones</h3>
            </div>
            <div className="flex-1 overflow-auto text-sm">
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
        </div>

        {/* Columna derecha (contexto) */}
        <div className="flex flex-col gap-4 min-h-0">
          {/* Detalles del caso */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText size={16} className="text-slate-600" />
                <h3 className="text-base font-semibold text-slate-900">Detalles del Caso</h3>
              </div>
              <button
                onClick={() => setDetailsOpen(o => !o)}
                className="text-slate-500 hover:text-slate-700"
                aria-label="Alternar detalles"
              >
                {detailsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            </div>
            {selectedCaso ? (
              detailsOpen && (
                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <div className="flex justify-between"><span className="text-slate-500">ID Caso</span><span className="font-semibold text-slate-900">{selectedCaso.fields?.ID_Caso || selectedCaso.id}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Estudiante</span><span className="font-semibold text-slate-900">{headerInfo?.estudiante}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Curso</span><span className="font-semibold text-slate-900">{headerInfo?.curso}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Tipificación</span><span className="font-semibold text-slate-900">{headerInfo?.tipificacion}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Estado</span><span className="font-semibold text-emerald-700">{headerInfo?.estado}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Fecha incidente</span><span className="font-semibold text-slate-900">{headerInfo?.incidenteFecha ? formatDate(headerInfo.incidenteFecha) : 'Sin fecha'}</span></div>
                  {headerInfo?.diasDesde !== null && (
                    <div className="flex justify-between"><span className="text-slate-500">Transcurrido</span><span className="font-semibold text-slate-900">{headerInfo.diasDesde} días</span></div>
                  )}
                </div>
              )
            ) : (
              <div className="text-sm text-gray-500 mt-4">Selecciona un caso para ver detalles</div>
            )}
          </div>

          {/* Progreso del caso */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5 flex flex-col min-h-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <List size={16} className="text-purple-600" />
                <div>
                  <h3 className="text-base font-semibold leading-tight text-slate-900">Progreso del Caso</h3>
                  <p className="text-xs text-slate-500">{casoSeguimientos.length} acciones registradas</p>
                </div>
              </div>
              <button
                onClick={() => setVisualizerOpen(o => !o)}
                className="text-slate-500 hover:text-slate-700"
                aria-label="Alternar progreso"
              >
                {visualizerOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            </div>

            {selectedCaso ? (
              visualizerOpen && (
                <div className="mt-4 flex-1 overflow-auto">
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
                </div>
              )
            ) : (
              <div className="text-sm text-gray-500 mt-4">Selecciona un caso para ver el progreso del debido proceso</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
