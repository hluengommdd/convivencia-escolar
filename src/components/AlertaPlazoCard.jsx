import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAirtable } from '../hooks/useAirtable'

export default function AlertasPlazos() {
  const navigate = useNavigate()

  const { data: seguimientos, loading, error } = useAirtable(
    'SEGUIMIENTOS',
    'Control de Plazos'
  )

  const clasificados = useMemo(() => {
    const grupos = {
      rojos: [],
      naranjos: [],
      amarillos: [],
      verdes: [],
    }

    ;(seguimientos || []).forEach(s => {
      const alerta = s.fields?.Alerta_Urgencia || ''

      if (alerta.startsWith('🔴')) grupos.rojos.push(s)
      else if (alerta.startsWith('🟠')) grupos.naranjos.push(s)
      else if (alerta.startsWith('🟡')) grupos.amarillos.push(s)
      else if (alerta.startsWith('🟢') || alerta === 'En plazo')
        grupos.verdes.push(s)
    })

    return grupos
  }, [seguimientos])

  if (loading)
    return <p className="text-gray-500">Cargando alertas…</p>

  if (error)
    return <p className="text-red-500">Error: {error}</p>

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold">Alertas de Plazos</h1>

      <Resumen clasificados={clasificados} />

      <Seccion
        titulo="🔴 Vencidos"
        items={clasificados.rojos}
        navigate={navigate}
      />

      <Seccion
        titulo="🟠 Próximos a vencer"
        items={clasificados.naranjos}
        navigate={navigate}
      />

      <Seccion
        titulo="🟡 En observación"
        items={clasificados.amarillos}
        navigate={navigate}
      />
    </div>
  )
}

/* =========================
   COMPONENTES AUX
========================== */

function Resumen({ clasificados }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card label="🔴 Vencidos" value={clasificados.rojos.length} />
      <Card label="🟠 Próximos" value={clasificados.naranjos.length} />
      <Card label="🟡 Observación" value={clasificados.amarillos.length} />
      <Card label="🟢 En plazo" value={clasificados.verdes.length} />
    </div>
  )
}

function Card({ label, value }) {
  return (
    <div className="bg-white border rounded-xl p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  )
}

function Seccion({ titulo, items, navigate }) {
  if (!items.length) return null

  return (
    <div className="space-y-3">
      <h2 className="font-semibold">{titulo}</h2>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {items.map(s => {
          const casoId = s.fields?.CASOS_ACTIVOS?.[0]

          return (
            <div
              key={s.id}
              className="bg-white border rounded-xl p-4"
            >
              <p className="font-semibold">
                {s.fields?.Etapa_Debido_Proceso}
              </p>
              <p className="text-sm text-gray-600">
                Responsable: {s.fields?.Responsable || '—'}
              </p>
              <p className="text-xs text-gray-500">
                {s.fields?.Dias_Restantes} días restantes
              </p>

              <button
                onClick={() => navigate('/casos-activos')}
                className="mt-2 text-sm text-red-600 hover:underline"
                disabled={!casoId}
              >
                Ver caso →
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
