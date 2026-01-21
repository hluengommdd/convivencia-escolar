import { useMemo, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllControlAlertas, getCases } from '../api/db'
import { formatDate } from '../utils/formatDate'
import { AlertTriangle, Clock, CheckCircle, FileText } from 'lucide-react'

/* =========================
   Helpers de temporalidad (robustos a timezone)
========================== */

// Trunca una fecha a medianoche local para evitar desfases por hora/zona
function toStartOfDay(d) {
  const x = new Date(d)
  if (Number.isNaN(x.getTime())) return null
  x.setHours(0, 0, 0, 0)
  return x
}

// Diferencia en días enteros, robusta a timezone (usa medianoche local)
function diffDays(fromDate, toDate = new Date()) {
  if (!fromDate) return null
  const a = toStartOfDay(fromDate)
  const b = toStartOfDay(toDate)
  if (!a || !b) return null
  const ms = b.getTime() - a.getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

// Texto "hace X días" simple y consistente
function haceXDiasLabel(dias) {
  if (dias === null || dias === undefined) return null
  if (dias <= 0) return 'hoy'
  if (dias === 1) return 'hace 1 día'
  return `hace ${dias} días`
}

// Normaliza estado por si viene con espacios / mayúsculas
function normalizarEstado(estado) {
  return String(estado || '').trim().toLowerCase()
}

// Etiqueta de fuente para auditoría rápida
function fuenteActividad({ lastAction, createdAt, seguimiento }) {
  if (lastAction) return 'acción'
  if (createdAt) return 'creación'
  if (seguimiento) return 'seguimiento'
  return null
}

export default function AlertasPlazos() {
  const navigate = useNavigate()

  const [seguimientos, setSeguimientos] = useState([])
  const [casos, setCasos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function cargar() {
      try {
        setLoading(true)
        const [controlData, casesData] = await Promise.all([
          getAllControlAlertas(),
          getCases()
        ])

        // ✅ Filtrar alertas:
        // 1) No mostrar casos cerrados
        // 2) SOLO mostrar casos con seguimiento_started_at (proceso iniciado)
        const controlFiltrado = (controlData || []).filter((s) => {
          const casoId = s.fields?.CASOS_ACTIVOS?.[0]
          if (!casoId) return false

          const caso = (casesData || []).find((c) => c.id === casoId)
          if (!caso) return false

          // Caso cerrado → no mostrar
          const estado = normalizarEstado(caso?.fields?.Estado)
          if (estado === 'cerrado') return false

          // ✅ REGLA PRINCIPAL: solo casos con proceso iniciado
          if (!caso._supabaseData?.seguimiento_started_at) return false

          return true
        })

        setSeguimientos(controlFiltrado)
        setCasos(casesData || [])
      } catch (e) {
        console.error(e)
        setError(e?.message || 'Error al cargar alertas')
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [])

  /* =========================
     CLASIFICACIÓN
  ========================== */

  const clasificados = useMemo(() => {
    const grupos = {
      rojos: [],
      naranjos: [],
      amarillos: [],
      verdes: [],
      sin: [],
    }

    ;(seguimientos || []).forEach((s) => {
      const alerta = s.fields?.Alerta_Urgencia || '⏳ SIN PLAZO'

      if (String(alerta).startsWith('🔴')) grupos.rojos.push(s)
      else if (String(alerta).startsWith('🟠')) grupos.naranjos.push(s)
      else if (String(alerta).startsWith('🟡')) grupos.amarillos.push(s)
      else if (String(alerta).startsWith('✅') || String(alerta).startsWith('🟢'))
        grupos.verdes.push(s)
      else grupos.sin.push(s)
    })

    const sortByDays = (a, b) => {
      const da = a.fields?.Dias_Restantes
      const db = b.fields?.Dias_Restantes
      return (da ?? Infinity) - (db ?? Infinity)
    }

    Object.values(grupos).forEach((arr) => arr.sort(sortByDays))
    return grupos
  }, [seguimientos])

  const resumen = useMemo(
    () => ({
      rojos: clasificados.rojos.length,
      naranjos: clasificados.naranjos.length,
      amarillos: clasificados.amarillos.length,
      verdes: clasificados.verdes.length,
      sin: clasificados.sin.length,
    }),
    [clasificados]
  )

  if (loading) return <p className="text-gray-500">Cargando alertas…</p>
  if (error) return <p className="text-red-500">Error: {error}</p>

  return (
    <div className="container space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="page-title">Alertas y Control de Plazos</h1>
          <p className="text-sm text-gray-600 mt-1">
            Monitoreo operativo del debido proceso · Actualizado en tiempo real
          </p>
        </div>
      </div>

      {/* RESUMEN CON CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <CardResumen
          icon={<AlertTriangle className="text-red-600" size={24} />}
          label="Vencidos"
          value={resumen.rojos}
          color="red"
        />
        <CardResumen
          icon={<AlertTriangle className="text-purple-600" size={24} />}
          label="Urgentes"
          value={resumen.naranjos}
          color="purple"
        />
        <CardResumen
          icon={<Clock className="text-green-600" size={24} />}
          label="Próximos"
          value={resumen.amarillos}
          color="green"
        />
        <CardResumen
          icon={<CheckCircle className="text-green-600" size={24} />}
          label="En plazo"
          value={resumen.verdes}
          color="green"
        />
        <CardResumen
          icon={<FileText className="text-gray-500" size={24} />}
          label="Sin plazo"
          value={resumen.sin}
          color="gray"
        />
      </div>

      {/* SECCIONES (tarjetas debajo, como en GitHub) */}
      <div className="space-y-8">
        <Seccion
          titulo="🔴 Vencidos / Críticos"
          descripcion="Requieren acción inmediata"
          items={clasificados.rojos}
          casos={casos || []}
          navigate={navigate}
          tone="red"
        />

        <Seccion
          titulo="🟠 Urgentes"
          descripcion="Vencen hoy o en pocos días"
          items={clasificados.naranjos}
          casos={casos || []}
          navigate={navigate}
          tone="purple"
        />

        <Seccion
          titulo="🟡 Próximos / Preventivos"
          descripcion="Seguimiento anticipado"
          items={clasificados.amarillos}
          casos={casos || []}
          navigate={navigate}
          tone="green"
          compact
        />

        <Seccion
          titulo="✅ En Plazo"
          descripcion="Casos que están al día, cumpliendo con los plazos establecidos."
          items={clasificados.verdes}
          casos={casos || []}
          navigate={navigate}
          tone="green"
          compact
        />

        <Seccion
          titulo="⏳ Sin Plazo Definido"
          descripcion="Casos que no tienen un plazo específico asignado."
          items={clasificados.sin}
          casos={casos || []}
          navigate={navigate}
          tone="gray"
          compact
        />
      </div>

      {Object.values(resumen).every((v) => v === 0) && (
        <div className="bg-white border rounded-xl p-6 text-gray-500">
          No hay alertas activas en este momento.
        </div>
      )}
    </div>
  )
}

/* =========================
   COMPONENTES AUX
========================== */

function CardResumen({ icon, label, value, color }) {
  const colorClasses = {
    red: 'bg-red-50 border-red-200',
    purple: 'bg-purple-50 border-purple-200',
    orange: 'bg-orange-50 border-orange-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    green: 'bg-green-50 border-green-200',
    gray: 'bg-gray-50 border-gray-200'
  }

  return (
    <div className={`rounded-2xl p-4 card ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        {icon}
        <span
          className={`text-3xl font-bold ${
            color === 'gray' ? 'text-gray-700' : `text-${color}-700`
          }`}
        >
          {value}
        </span>
      </div>
      <div className="text-sm font-medium text-gray-700">{label}</div>
    </div>
  )
}

function Seccion({
  titulo,
  descripcion,
  items,
  casos,
  navigate,
  tone,
  compact = false,
}) {
  if (!items || items.length === 0) return null

  const toneMap = {
    red: {
      border: 'border-red-200',
      bg: 'bg-red-50',
      hover: 'hover:bg-red-100 hover:shadow-md',
      text: 'text-red-900',
      badge: 'bg-red-100 text-red-800'
    },
    purple: {
      border: 'border-purple-200',
      bg: 'bg-purple-50',
      hover: 'hover:bg-purple-100 hover:shadow-md',
      text: 'text-purple-900',
      badge: 'bg-purple-100 text-purple-800'
    },
    green: {
      border: 'border-green-200',
      bg: 'bg-green-50',
      hover: 'hover:bg-green-100 hover:shadow-md',
      text: 'text-green-900',
      badge: 'bg-green-100 text-green-800'
    },
    gray: {
      border: 'border-gray-200',
      bg: 'bg-gray-50',
      hover: 'hover:bg-gray-100 hover:shadow-md',
      text: 'text-gray-900',
      badge: 'bg-gray-100 text-gray-800'
    }
  }

  const styles = toneMap[tone] || toneMap.gray

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="section-title">{titulo}</h2>
        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">
          {items.length}
        </span>
      </div>
      <p className="text-sm text-gray-600">{descripcion}</p>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {items.map((s) => {
          const casoId = s.fields?.CASOS_ACTIVOS?.[0]
          const dias = s.fields?.Dias_Restantes
          const disabled = !casoId

          // Buscar información del caso asociado
          const caso = casos?.find((c) => c.id === casoId)
          const estudiante = caso?.fields?.Estudiante_Responsable
          const curso = caso?.fields?.Curso_Incidente

          // Temporalidad: última actividad con fallbacks
          const lastAction = s._supabaseData?.last_action_date
          const createdAt = caso?._supabaseData?.created_at || caso?.fields?.Fecha_Creacion
          const seguimiento = s.fields?.Fecha_Seguimiento
          const refActividad = lastAction || createdAt || seguimiento
          const diasActividad = diffDays(refActividad)
          const actividadLabel = haceXDiasLabel(diasActividad)
          const fuente = fuenteActividad({ lastAction, createdAt, seguimiento })

          return (
            <div
              key={s.id}
              onClick={() => !disabled && navigate(`/seguimientos?caso=${casoId}`)}
              className={`border-2 rounded-xl p-5 transition-all
                ${styles.border} ${styles.bg} ${!disabled && styles.hover}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${compact ? 'text-sm' : ''}
              `}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className={`font-bold ${styles.text} mb-1`}>
                    {s.fields?.Etapa_Debido_Proceso || 'Etapa sin dato'}
                  </p>
                  {estudiante && (
                    <p className="text-sm font-semibold text-gray-800 mb-1">
                      👤 {estudiante} {curso && `· ${curso}`}
                    </p>
                  )}
                  <p className="text-sm text-gray-700">
                    <strong>Estado:</strong> {s.fields?.Estado || '—'}
                  </p>
                </div>

                <div className="flex flex-col items-end">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${styles.badge} whitespace-nowrap`}
                  >
                    {typeof dias === 'number'
                      ? dias < 0
                        ? `Vencido ${Math.abs(dias)}d`
                        : dias === 0
                        ? 'Vence hoy'
                        : `${dias} días`
                      : 'Sin plazo'}
                  </span>
                  {s.fields?.Fecha_Plazo && (
                    <span className="text-xs text-gray-500 mt-1">
                      {formatDate(s.fields?.Fecha_Plazo)}
                    </span>
                  )}
                </div>
              </div>

              {/* Temporalidad (secundaria): NO repetir el SLA (eso va en el badge) */}
              {actividadLabel && (
                <p className="text-sm text-gray-600">
                  {lastAction ? `Última acción ${actividadLabel}` : `Abierto ${actividadLabel}`}
                  {refActividad && (
                    <span className="text-xs text-gray-400">
                      {' '}
                      · {formatDate(refActividad)}
                      {fuente ? ` · (${fuente})` : ''}
                    </span>
                  )}
                </p>
              )}

              {s.fields?.Detalle && (
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                  {s.fields.Detalle}
                </p>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <span className="text-xs font-medium text-gray-500">
                  {s.fields?.Tipo_Accion || 'Sin tipo'}
                </span>
                <span className="text-xs text-gray-400">
                  {s.fields?.Fecha_Plazo
                    ? `Plazo: ${formatDate(s.fields?.Fecha_Plazo)}`
                    : (s.fields?.Fecha_Seguimiento ? formatDate(s.fields?.Fecha_Seguimiento) : '—')}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
