import { useMemo, useState } from "react";
import SeguimientoItem from "../components/SeguimientoItem";

const ETAPAS = [
  "1. Comunicación/Denuncia",
  "2. Notificación Apoderados",
  "3. Recopilación Antecedentes",
  "4. Entrevistas",
  "5. Investigación/Análisis",
  "6. Resolución y Sanciones",
  "7. Apelación/Recursos",
  "8. Seguimiento",
];

function getStageKey(seg) {
  return seg?.fields?.Etapa_Debido_Proceso || "Sin etapa";
}

function parseStageNumber(stageKey) {
  const m = String(stageKey).match(/^(\d+)\./);
  return m ? parseInt(m[1], 10) : 999;
}

export default function DueProcessAccordions({
  seguimientos = [],
  onRegistrarAccion,
}) {
  const [open, setOpen] = useState(() => new Set(["4. Entrevistas"]));

  const grouped = useMemo(() => {
    const map = new Map();

    for (const s of seguimientos || []) {
      const k = getStageKey(s);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(s);
    }

    // ordenar acciones dentro de etapa por fecha desc (si existe)
    for (const [, arr] of map.entries()) {
      arr.sort((a, b) => {
        const da = a?.fields?.Fecha || "";
        const db = b?.fields?.Fecha || "";
        return db.localeCompare(da);
      });
    }

    const keys = Array.from(map.keys());
    keys.sort((a, b) => parseStageNumber(a) - parseStageNumber(b));

    return { map, keys };
  }, [seguimientos]);

  // mostrar todas las etapas aunque no tengan acciones (mejor UX)
  const allStageKeys = useMemo(() => {
    const merged = [...ETAPAS];
    for (const k of grouped.keys) {
      if (!merged.includes(k)) merged.push(k);
    }
    return merged;
  }, [grouped.keys]);

  function toggle(stageKey) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(stageKey)) next.delete(stageKey);
      else next.add(stageKey);
      return next;
    });
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Debido proceso
          </h3>
          <p className="text-sm text-slate-500">
            Acciones agrupadas por etapa
          </p>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {allStageKeys.map((stageKey) => {
          const items = grouped.map.get(stageKey) || [];
          const isOpen = open.has(stageKey);

          return (
            <div key={stageKey} className="px-5 py-3">
              <button
                type="button"
                onClick={() => toggle(stageKey)}
                className="w-full flex items-center justify-between gap-3 text-left"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 truncate">
                      {stageKey}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {items.length} acc.
                    </span>
                  </div>
                  <div className="text-sm text-slate-500">
                    {items.length === 0
                      ? "Sin acciones registradas"
                      : "Ver acciones de esta etapa"}
                  </div>
                </div>

                <span className="text-slate-400">{isOpen ? "▾" : "▸"}</span>
              </button>

              {isOpen && (
                <div className="mt-4">
                  {items.length > 0 ? (
                    <div className="space-y-3">
                      {items.map((seg) => (
                        <div
                          key={seg.id}
                          id={`seg-${seg.id}`}
                          className="rounded-xl border border-slate-100 bg-white p-4"
                        >
                          <SeguimientoItem seg={seg} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-3 text-sm text-slate-500">
                      No hay acciones en esta etapa.
                    </div>
                  )}

                  {/* Link secundario (NO botón primario) */}
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => onRegistrarAccion?.(stageKey)}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      + Registrar acción
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
