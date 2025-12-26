import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAirtable } from '../hooks/useAirtable'

export default function AlertasPlazos() {
  const navigate = useNavigate()

  const { data: seguimientos, loading, error } = useAirtable(
    'SEGUIMIENTOS',
    'Control de Plazos'
  )

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

    ;(seguimientos || []).forEach(s => {
      const alerta = s.fields?.Alerta_Urgencia || '⏳ SIN PLAZO'

      if (alerta.startsWith('🔴')) grupos.rojos.push(s)
      else if (alerta.startsWith('🟠')) grupos.naranjos.push(s)
      else if (alerta.startsWith('🟡')) grupos.amarillos.push(s)
      else if (alerta.startsWith('✅')) grupos.verdes.push(s)
      else grupos.sin.push(s)
    })

    const sortByDays = (a, b) => {
      const da = a.fields?.Dias_Restantes
      const db = b.fields?.Dias_Restantes
      return (da ?? Infinity) - (db ?? Infinity)
    }

    Object.values(grupos).forEach(arr => arr.sort(sortByDays))
    return grupos
  }, [seguimientos])

  const resumen = useMemo(() => ({
    rojos: clasificados.rojos.length,
    naranjos: clasificados.naranjos.length,
    amarillos: clasificados.amarillos.length,
    verdes: clasificados.verdes.length,
    sin: clasificados.sin.length,
  }), [clasificados])

  if (loading) return <p className="text-gray-500">Cargando alertas…</p>
  if (error) return <p className="text-red-500">Error: {error}</p>

  return (
    <div className="space-y-10">
      <p className="text-sm text-gray-600">
        Control operativo de plazos · Debido proceso
      </p>

      {/* RESUMEN */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Resumen label="🔴 Vencidos" value={resumen.rojos} color="text-red-600" />
        <Resumen label="🟠 Urgentes" value={resumen.naranjos} color="text-orange-600" />
        <Resumen label="🟡 Próximos" value={resumen.amarillos} color="text-yellow-600" />
        <Resumen label="✅ En plazo" value={resumen.verdes} color="text-green-600" />
        <Resumen label="⏳ Sin plazo" value={resumen.sin} color="text-gray-500" />
      </div>

      {/* SECCIONES */}
      <Seccion
        titulo="🔴 Vencidos / Críticos"
        descripcion="Requieren acción inmediata"
        items={clasificados.rojos}
        navigate={navigate}
        tone="red"
        large
      />

      <Seccion
        titulo="🟠 Urgentes"
        descripcion="Vencen hoy o en pocos días"
        items={clasificados.naranjos}
        navigate={navigate}
        tone="orange"
      />

      <Seccion
        titulo="🟡 Preventivos"
        descripcion="Seguimiento anticipado"
        items={clasificados.amarillos}
        navigate={navigate}
        tone="yellow"
        compact
      />

      {Object.values(resumen).every(v => v === 0) && (
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

function Resumen({ label, value, color }) {
  return (
    <div className="bg-white border rounded-xl p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  )
}

function Seccion({
  titulo,
  descripcion,
  items,
  navigate,
  tone,
  large = false,
  compact = false,
}) {
  if (!items || items.length === 0) return null

  const toneMap = {
    red: 'border-red-300 bg-red-50',
    orange: 'border-orange-300 bg-orange-50',
    yellow: 'border-yellow-300 bg-yellow-50',
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-semibold text-gray-900">{titulo}</h2>
        <p className="text-xs text-gray-600">{descripcion}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {items.map(s => {
          const casoId = s.fields?.CASOS_ACTIVOS?.[0]
          const dias = s.fields?.Dias_Restantes
          const disabled = !casoId

          return (
            <div
              key={s.id}
              onClick={() => !disabled && navigate(`/seguimientos?caso=${casoId}`)}
              className={`border rounded-xl p-${large ? '5' : '4'} transition
                ${toneMap[tone]}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'}
                ${compact ? 'text-sm' : ''}
              `}
            >
              <p className="font-semibold text-gray-900">
                {s.fields?.Etapa_Debido_Proceso || 'Etapa sin dato'}
              </p>

              <p className="text-xs text-gray-700">
                Responsable: {s.fields?.Responsable || '—'}
              </p>

              <p className="text-xs text-gray-600 mt-1">
                {typeof dias === 'number'
                  ? dias < 0
                    ? `Vencido hace ${Math.abs(dias)} día(s)`
                    : dias === 0
                    ? 'Vence hoy'
                    : `Faltan ${dias} día(s)`
                  : 'Sin plazo definido'}
              </p>

              <div className="text-xs font-semibold mt-2">
                {s.fields?.Alerta_Urgencia || '⏳'}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
