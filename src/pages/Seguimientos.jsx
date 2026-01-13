import { useEffect, useMemo, useState } from "react";
import { getCases, getControlPlazos } from "../api/db";
import { formatDate } from "../utils/formatDate";
import { useSeguimientos } from "../hooks/useSeguimientos";

import SeguimientoPage from "./SeguimientoPage";
import ProcesoVisualizer from "../components/ProcesoVisualizer";
import DueProcessAccordions from "../components/DueProcessAccordions";

import { Menu, UserRound, BadgeCheck, CalendarClock, ChevronRight } from "lucide-react";

function Chip({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${className}`}
    >
      {children}
    </span>
  );
}

function getTipChip(tip) {
  const t = tip || "Sin tipificación";
  if (t === "Leve") return "bg-green-100 text-green-800";
  if (t === "Grave") return "bg-yellow-100 text-yellow-800";
  if (t === "Muy Grave") return "bg-purple-100 text-purple-800";
  if (t === "Gravísima") return "bg-red-100 text-red-800";
  return "bg-slate-100 text-slate-700";
}

export default function Seguimientos() {
  const [casos, setCasos] = useState([]);
  const [selectedCaso, setSelectedCaso] = useState(null);
  
  const [externalMostrarForm, setExternalMostrarForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [procesoInfo, setProcesoInfo] = useState(null);
  const [controlPlazos, setControlPlazos] = useState([]);


  const doRefresh = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    async function cargar() {
      setLoading(true);
      let data = [];

      try {
        data = await getCases();
      } catch (e) {
        console.error('Error cargando casos:', e);
        data = [];
      }

      // SOLO CASOS EN SEGUIMIENTO (EXCLUYE CERRADOS)
      const enSeguimiento = (data || []).filter((c) => (c.fields || {}).Estado !== "Cerrado");
      setCasos(enSeguimiento);

      setLoading(false);
    }

    cargar();
  }, [refreshKey]);

  useEffect(() => {
    // cuando se selecciona un caso, colapsar el panel izquierdo para dar foco
    if (selectedCaso) setLeftCollapsed(true)
    else setLeftCollapsed(false)
  }, [selectedCaso])

  useEffect(() => {
    // Cargar datos de v_control_plazos y filtrar por caso seleccionado
    async function cargarPlazos() {
      if (!selectedCaso?.id) {
        setControlPlazos([])
        return
      }

      try {
        const all = await getControlPlazos()
        const relevantes = (all || []).filter(r => {
          const casoId = r.fields?.Caso_ID || (r.fields?.CASOS_ACTIVOS && r.fields.CASOS_ACTIVOS[0])
          return casoId === selectedCaso.id || (Array.isArray(r.fields?.CASOS_ACTIVOS) && r.fields.CASOS_ACTIVOS.includes(selectedCaso.id))
        })
        setControlPlazos(relevantes)
      } catch (e) {
        console.error('Error fetching v_control_plazos for selected case (non-fatal):', e)
        setControlPlazos([])
      }
    }

    cargarPlazos()
  }, [selectedCaso?.id, refreshKey])

  const { data: casoSeguimientos = [] } = useSeguimientos(
    selectedCaso?.id || null,
    selectedCaso ? refreshKey : null
  );

  const selectedMeta = useMemo(() => {
    if (!selectedCaso) return null;
    const f = selectedCaso.fields || {};
    return {
      estudiante: f.Estudiante_Responsable || "—",
      curso: f.Curso_Incidente || f.Curso || "—",
      estado: f.Estado || "—",
      tipificacion: f.Tipificacion_Conducta || "—",
      fecha: f.Fecha_Incidente ? formatDate(f.Fecha_Incidente) : "—",
      hora: f.Hora_Incidente || "",
    };
  }, [selectedCaso]);

  return (
    <div className="h-full">
      {/* Full-width progreso visualizador: aparece debajo del título principal de la página */}
      {selectedCaso && (
        <div className="mb-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-700">Progreso del caso</div>
                <div className="text-xs text-slate-500">{casoSeguimientos?.length || 0} acciones</div>
              </div>

              <div className="text-xs text-slate-500">{procesoInfo ? (procesoInfo.etapaActualCorto || procesoInfo.etapaActualNombre) : '—'}</div>
            </div>

            <div className="mt-3">
              <ProcesoVisualizer
                compact
                showPlazoDias
                seguimientos={casoSeguimientos || []}
                fechaInicio={selectedCaso?.fields?.Fecha_Incidente || null}
                controlPlazos={controlPlazos}
                onSelectStep={(followupId) => {
                  try {
                    const el = document.getElementById(`seg-${followupId}`)
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  } catch (e) {
                    console.debug('scrollTo seg failed', e)
                  }
                }}
                onComputed={setProcesoInfo}
              />
            </div>
          </div>
        </div>
      )}
      {/* Layout: sidebar interno de casos + contenido 2 columnas */}
      <div className={`grid grid-cols-1 ${leftCollapsed ? 'xl:grid-cols-[80px_1fr]' : 'xl:grid-cols-[420px_1fr]'} gap-6 h-full`}>
        {/* PANEL IZQUIERDO: Casos en seguimiento */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-full flex flex-col min-h-0">
          {/* Compact view when collapsed */}
          {leftCollapsed ? (
            <div className="h-full flex flex-col items-center py-4 px-2">
              <button
                onClick={() => setLeftCollapsed(false)}
                className="mb-4 p-2 rounded-full bg-slate-100 text-slate-700"
                aria-label="Expandir lista de casos"
              >
                <ChevronRight size={16} />
              </button>

              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-700">
                {selectedCaso?.fields?.Estudiante_Responsable ? selectedCaso.fields.Estudiante_Responsable.split(' ').map(n=>n[0]).slice(0,2).join('') : '—'}
              </div>
              <div className="text-xs text-slate-500 mt-2 text-center line-clamp-2 px-1">
                {selectedCaso?.fields?.Estudiante_Responsable || 'Casos'}
              </div>
            </div>
          ) : (
            <>
              <div className="px-4 sm:px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <Menu size={18} className="text-blue-600" />
                  <h2 className="text-base font-semibold leading-tight">
                    Casos en seguimiento
                  </h2>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  Selecciona un caso para ver el debido proceso
                </p>
              </div>

              <div className="hidden sm:grid grid-cols-12 gap-2 px-4 sm:px-6 py-2 text-xs font-semibold text-slate-500 border-b border-slate-100">
                <div className="sm:col-span-1">#</div>
                <div className="sm:col-span-3">Fecha</div>
                <div className="sm:col-span-4">Estudiante</div>
                <div className="sm:col-span-2">Tipif.</div>
                <div className="sm:col-span-2">Estado</div>
              </div>

              <div className="flex-1 overflow-auto text-sm">
                {loading && (
                  <p className="p-4 sm:p-6 text-slate-500 text-sm">
                    Cargando casos…
                  </p>
                )}
                {!loading && (
                  <div className="divide-y divide-slate-100">
                    {casos.map((caso, index) => {
                      const f = caso.fields || {};
                      const isActive = selectedCaso?.id === caso.id;

                      return (
                        <div
                          key={caso.id}
                          onClick={() => { setSelectedCaso(caso); setLeftCollapsed(true); }}
                          className={`grid grid-cols-1 sm:grid-cols-12 gap-2 px-4 sm:px-6 py-3 cursor-pointer hover:bg-slate-50 ${
                            isActive ? "bg-slate-50 border-l-2 border-blue-500" : ""
                          }`}
                        >
                          <div className="sm:col-span-1 text-slate-400">
                            {index + 1}
                          </div>
                          <div className="sm:col-span-3">
                            <p className="font-medium">
                              {f.Fecha_Incidente ? formatDate(f.Fecha_Incidente) : "—"}
                            </p>
                            <p className="text-xs text-slate-400">
                              {f.Hora_Incidente || ""}
                            </p>
                          </div>
                          <div className="sm:col-span-4 font-semibold truncate">
                            {f.Estudiante_Responsable || "—"}
                          </div>
                          <div className="sm:col-span-2">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getTipChip(
                                f.Tipificacion_Conducta
                              )}`}
                            >
                              {f.Tipificacion_Conducta || "—"}
                            </span>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                              {f.Estado || "—"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* PANEL DERECHO: Caso seleccionado */}
        <div className="h-full min-h-0">
          {!selectedCaso ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-slate-500 h-full flex items-center justify-center">
              Selecciona un caso para comenzar
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 h-full min-h-0">
              <div className={`w-full flex ${leftCollapsed ? 'justify-start' : 'justify-center'}`}>
                <div className={`grid grid-cols-1 md:grid-cols-[minmax(480px,1fr)_minmax(480px,1fr)] gap-6 w-full ${leftCollapsed ? 'max-w-[calc(100%-96px)]' : 'max-w-[1040px]'}`}>
                  {/* Columna principal: Header + Debido proceso */}
                  <div className="h-full min-h-0 flex flex-col gap-6">
                    <div className="space-y-6">
                      {/* Header del caso (CTA primario único) */}
                      <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-100 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
                        <div className="px-8 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex items-center gap-5 min-w-0">
                            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
                              <UserRound size={22} className="text-white" />
                            </div>

                            <div className="min-w-0">
                              <div className="text-xl tracking-tight font-semibold truncate">
                                {selectedMeta?.estudiante}
                              </div>
                              <div className="text-sm text-white/70 truncate">
                                {selectedMeta?.curso}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            <Chip className={getTipChip(selectedMeta?.tipificacion)}>
                              {selectedMeta?.tipificacion}
                            </Chip>

                            <Chip className="bg-white/10 text-white">
                              <BadgeCheck size={14} className="mr-1" />
                              {selectedMeta?.estado}
                            </Chip>

                            <Chip className="bg-white/10 text-white">
                              <CalendarClock size={14} className="mr-1" />
                              {selectedMeta?.fecha}
                            </Chip>

                            <button
                              type="button"
                              onClick={() => setExternalMostrarForm(true)}
                              className="ml-0 sm:ml-3 inline-flex items-center gap-2 bg-white text-slate-900 hover:bg-slate-100 px-4 py-3 rounded-2xl text-base font-semibold shadow-sm"
                            >
                              + Registrar acción
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Debido proceso agrupado por etapa */}
                      <div>
                        <DueProcessAccordions
                          seguimientos={casoSeguimientos || []}
                          onRegistrarAccion={() => setExternalMostrarForm(true)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Columna secundaria: Detalles + Progreso */}
                  <div className="h-full min-h-0 flex flex-col gap-6">
                    {/* Detalles del caso (embebido, sin CTA interno) */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 min-h-[320px] overflow-auto">
                      <div className="text-sm font-semibold text-slate-900 mb-2">
                        Detalles del caso
                      </div>

                      <SeguimientoPage
                        casoId={selectedCaso.id}
                        onDataChange={doRefresh}
                        onCaseClosed={() => {
                          setSelectedCaso(null);
                          doRefresh();
                        }}
                        showHistorial={false}
                        embedded={true}
                        hideNewAction={true}
                        hideHeader={true}
                        hideResumen={false}
                        externalMostrarForm={externalMostrarForm}
                        setExternalMostrarForm={setExternalMostrarForm}
                      />
                    </div>
                    {/* Right column reserved for details, involucrados and actions (no visualizador) */}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
