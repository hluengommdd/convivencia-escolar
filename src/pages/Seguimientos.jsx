import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import ProcesoVisualizer from '../components/ProcesoVisualizer'
import DueProcessAccordion from '../components/DueProcessAccordion'
import CaseDetailsCard from '../components/CaseDetailsCard'
import InvolucradosList from '../components/InvolucradosList'
import SeguimientoForm from '../components/SeguimientoForm'

import { useSeguimientos } from '../hooks/useSeguimientos'
import { useDueProcess } from '../hooks/useDueProcess'
import { usePlazosResumen } from '../hooks/usePlazosResumen'
import { getCase } from '../api/db'

export default function Seguimientos() {
  const { caseId } = useParams()
  const casoId = caseId || null

  const [refreshKey, setRefreshKey] = useState(0)
  const doRefresh = () => setRefreshKey(k => k + 1)

  const [mostrarForm, setMostrarForm] = useState(false)
  const [defaultStage, setDefaultStage] = useState(null)

  const [caso, setCaso] = useState(null)
  const [loadingCaso, setLoadingCaso] = useState(false)

  const { data: seguimientos = [], loading: loadingSeg } = useSeguimientos(casoId, refreshKey)
  const { stages, currentStageKey, completedStageKeys, stageSlaMap } = useDueProcess(casoId, refreshKey)
  const { row: plazoRow } = usePlazosResumen(casoId, refreshKey)

  // Construir flags para vencimiento
  const dias = plazoRow?.dias_restantes ?? null

  let isOverdue = false
  let overdueLabel = null

  if (dias !== null && Number.isFinite(dias)) {
    if (dias < 0) {
      isOverdue = true
      overdueLabel = `Vencido ${Math.abs(dias)} día${Math.abs(dias) === 1 ? '' : 's'}`
    } else if (dias === 0) {
      isOverdue = true
      overdueLabel = 'Vence hoy'
    } else {
      isOverdue = false
      overdueLabel = `Vence en ${dias} día${dias === 1 ? '' : 's'}`
    }
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!casoId) { setCaso(null); return }
      try {
        setLoadingCaso(true)
        const c = await getCase(casoId)
        if (!cancelled) setCaso(c)
      } catch (e) {
        console.error(e)
        if (!cancelled) setCaso(null)
      } finally {
        if (!cancelled) setLoadingCaso(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [casoId, refreshKey])

  if (!casoId) {
    return <div className="p-6 text-gray-500">Selecciona un caso desde el sidebar.</div>
  }

  return (
    <div className="h-full w-full p-4 sm:p-6 space-y-6">

      {/* ARRIBA: Fases del Debido Proceso */}
      <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3 gap-3">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            Fases del Debido Proceso
          </h2>

          <button
            onClick={() => {
              setDefaultStage(currentStageKey || null)
              setMostrarForm(true)
            }}
            className="px-3 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            + Registrar acción
          </button>
        </div>

        <ProcesoVisualizer
          stages={stages}
          currentStageKey={currentStageKey}
          completedStageKeys={completedStageKeys}
          stageSlaMap={stageSlaMap}
        />
      </div>

      {/* ABAJO: 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* IZQ: Acordeón por etapa (sin timeline) */}
        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 min-h-[420px]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              Acciones del Debido Proceso
            </h3>
            <div className="text-sm text-gray-500">
              {loadingSeg ? 'Cargando…' : `${seguimientos.length} acciones`}
            </div>
          </div>

          <DueProcessAccordion
            stages={stages}
            followups={seguimientos}
            currentStageKey={currentStageKey}
            onAddActionForStage={(stageKey) => {
              setDefaultStage(stageKey)
              setMostrarForm(true)
            }}
          />
        </div>

        {/* DER: Detalles del caso (mock style) */}
        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 min-h-[420px]">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
            Detalles del Caso
          </h3>

          {loadingCaso && <p className="text-sm text-gray-500">Cargando caso…</p>}

          {!loadingCaso && caso?.fields && (
            <CaseDetailsCard
              caso={caso}
              isOverdue={isOverdue}
              overdueLabel={overdueLabel || 'Vencido'}
              isReincidente={false}
              involucradosSlot={<InvolucradosList casoId={casoId} readOnly />}
            />
          )}

          {!loadingCaso && !caso && (
            <p className="text-sm text-red-600">No se pudo cargar el caso.</p>
          )}
        </div>
      </div>

      {/* MODAL: Registrar acción */}
      {mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative">
            <button
              onClick={() => { setMostrarForm(false); setDefaultStage(null) }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>

            <h2 className="text-lg font-semibold mb-4">Registrar nueva acción</h2>

            <SeguimientoForm
              casoId={casoId}
              defaultProcessStage={defaultStage}
              onSaved={() => {
                setMostrarForm(false)
                setDefaultStage(null)
                doRefresh()
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
