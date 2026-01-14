import { useMemo } from "react";

function daysFrom(iso) {
  if (!iso) return null;
  const a = new Date(iso + "T00:00:00");
  const b = new Date();
  const diff = Math.floor((b - a) / (1000 * 60 * 60 * 24));
  return Number.isFinite(diff) ? diff : null;
}

function Chip({ children, tone = "gray" }) {
  const map = {
    gray: "bg-gray-200 text-gray-700",
    green: "bg-emerald-200 text-emerald-800",
    purple: "bg-violet-200 text-violet-800",
    amber: "bg-amber-200 text-amber-900",
    rose: "bg-rose-200 text-rose-800",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold ${map[tone]}`}>
      {children}
    </span>
  );
}

export default function CaseDetailsCard({
  caso,
  involucradosSlot = null,
  isOverdue = false,
  overdueLabel = "Vencido",
  isReincidente = false,
  headerImageUrl = null,
}) {
  const f = caso?.fields || {};

  const nombre = f.Estudiante_Responsable || "Estudiante";
  const curso = f.Curso_Incidente || "—";
  const gravedad = f.Tipificacion_Conducta || "Muy Grave";
  const estado = f.Estado || "En Seguimiento";
  const desc = f.Descripcion || "Sin descripción";
  const fechaIncidente = f.Fecha_Incidente || null;

  const abiertoDias = useMemo(() => daysFrom(fechaIncidente), [fechaIncidente]);
  const abiertoTxt =
    abiertoDias === null ? null : `Abierto hace ${abiertoDias} día${abiertoDias === 1 ? "" : "s"}`;

  const headerStyle = headerImageUrl
    ? { backgroundImage: `url(${headerImageUrl})` }
    : {};

  return (
    <div className="rounded-2xl border bg-white overflow-hidden">
      <div
        className={`relative h-28 ${headerImageUrl ? "bg-cover bg-center" : "bg-gradient-to-br from-slate-700 to-slate-500"}`}
        style={headerStyle}
      >
        <div className="absolute inset-0 bg-black/25" />
        <div className="absolute inset-0 p-4 flex gap-3 items-center">
          <div className="w-14 h-14 rounded-full bg-white/85 flex items-center justify-center overflow-hidden border border-white/60">
            <span className="text-2xl">🙂</span>
          </div>

          <div className="min-w-0 text-white">
            <div className="text-xs opacity-90">Estudiante</div>
            <div className="font-extrabold leading-tight truncate">{nombre}</div>
            <div className="text-sm opacity-90 truncate">Curso: {curso}</div>

            <div className="flex flex-wrap gap-2 mt-2">
              <Chip tone="purple">{gravedad}</Chip>
              <Chip tone="green">{estado}</Chip>
              {isOverdue && <Chip tone="amber">{overdueLabel}</Chip>}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-3">
        {(abiertoTxt || overdueLabel) && (
          <div className="text-sm text-gray-600">
            {abiertoTxt || ""}
            {abiertoTxt && overdueLabel ? " - " : ""}
            {overdueLabel || ""}
          </div>
        )}
        {isReincidente && (
          <div className="mt-2">
            <Chip tone="rose">Reincidente</Chip>
          </div>
        )}
      </div>

      <div className="px-4 pt-4">
        <div className="text-base font-extrabold text-gray-900">Descripción Breve</div>
        <div className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{desc}</div>
      </div>

      <div className="px-4 py-4">
        <div className="text-base font-extrabold text-gray-900 mb-3">Involucrados</div>
        {involucradosSlot ? involucradosSlot : <div className="text-sm text-gray-500">Sin involucrados.</div>}
      </div>
    </div>
  );
}
