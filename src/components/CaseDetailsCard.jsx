import { useMemo } from "react"
import { formatDate } from "../utils/formatDate"

// =========================
// Helpers de temporalidad (robustos a timezone)
// =========================

// Trunca una fecha a medianoche local para evitar desfases por hora/zona
function toStartOfDay(d) {
  const x = new Date(d)
  if (Number.isNaN(x.getTime())) return null
  x.setHours(0, 0, 0, 0)
  return x
}

// Diferencia en días enteros, robusta a timezone
function daysFrom(fromDate, toDate = new Date()) {
  if (!fromDate) return null
  const a = toStartOfDay(fromDate)
  const b = toStartOfDay(toDate)
  if (!a || !b) return null
  const ms = b.getTime() - a.getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

// Texto humano consistente
function haceXDiasLabel(dias) {
  if (dias === null || dias === undefined) return null
  if (dias <= 0) return 'hoy'
  if (dias === 1) return 'hace 1 día'
  return `hace ${dias} días`
}

// Fuente de la actividad (auditoría/soporte)
function fuenteActividad({ lastAction, createdAt, seguimiento }) {
  if (lastAction) return 'acción'
  if (createdAt) return 'creación'
  if (seguimiento) return 'seguimiento'
  return null
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
  isPendingStart = false,
  actionsSlot = null,
}) {
  const f = caso?.fields || {};

  const nombre = f.Estudiante_Responsable || "Estudiante";
  const curso = f.Curso_Incidente || "—";
  const gravedad = f.Tipificacion_Conducta || "Muy Grave";
  const estado = f.Estado || "En Seguimiento";
  const desc = f.Descripcion || "Sin descripción";
  const fechaIncidente = f.Fecha_Incidente || null;

  // =========================
  // Temporalidad secundaria (NO repetir SLA aquí)
  // =========================

  const lastAction = caso?._supabaseData?.last_action_date || null
  const createdAt = caso?._supabaseData?.created_at || f?.Fecha_Creacion || null
  const seguimiento = f?.Fecha_Seguimiento || null

  // prioridad: acción > creación > seguimiento
  const refActividad = lastAction || createdAt || seguimiento

  const actividadDias = daysFrom(refActividad)

  const actividadTxt =
    actividadDias === null
      ? null
      : (lastAction
          ? `Última acción ${haceXDiasLabel(actividadDias)}`
          : `Creado en sistema ${haceXDiasLabel(actividadDias)}`)

  const fuente = fuenteActividad({ lastAction, createdAt, seguimiento })

  const headerStyle = headerImageUrl
    ? { backgroundImage: `url(${headerImageUrl})` }
    : {};

  return (
    <div className="rounded-2xl border bg-white flex flex-col">
      {/* Header */}
      <div
        className={`relative h-28 ${
          headerImageUrl ? "bg-cover bg-center" : "bg-gradient-to-br from-slate-700 to-slate-500"
        }`}
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
              {isPendingStart ? (
                <Chip tone="gray">Pendiente de iniciar</Chip>
              ) : (
                <Chip tone="green">{estado}</Chip>
              )}
              {isOverdue && <Chip tone="amber">{overdueLabel}</Chip>}
            </div>
          </div>
        </div>
      </div>

      {/* Body scrolleable */}
      <div className="flex-1 overflow-auto">
        <div className="px-4 pt-3">
          {actividadTxt && (
            <div className="text-sm text-gray-600">
              {actividadTxt}
              {refActividad && (
                <span className="text-xs text-gray-400">
                  {" "}· {formatDate(refActividad)}
                  {fuente ? ` · (${fuente})` : ""}
                </span>
              )}
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
          {involucradosSlot ? involucradosSlot : (
            <div className="text-sm text-gray-500">Sin involucrados.</div>
          )}
        </div>
      </div>
      {/* Footer acciones */}
       {actionsSlot ? (
        <div className="border-t px-4 py-3 bg-white">
          {actionsSlot}
        </div>
      ) : null}
    </div>
  )
}
