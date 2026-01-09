import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { BarChart } from 'recharts/es6/chart/BarChart'
import { Bar } from 'recharts/es6/cartesian/Bar'
import { loadEstadisticas, getFechasFromAnioSemestre } from '../api/estadisticas'
import { onDataUpdated } from '../utils/refreshBus'
import { useToast } from '../hooks/useToast'

// Color palette for Tipificacion_Conducta (consistent across app)
const TIPOS_COLORS = {
  'Leve': '#10b981',       // green
  'Grave': '#eab308',      // yellow
  'Muy Grave': '#8b5cf6',  // purple
  'Gravísima': '#ef4444',  // red
}

const COLORS = Object.values(TIPOS_COLORS)

/* =========================
   COMPONENTE
========================== */

export default function Estadisticas() {
  const [anio, setAnio] = useState('')
  const [semestre, setSemestre] = useState('Todos')
  const [cursoSeleccionado, setCursoSeleccionado] = useState('')
  
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { push } = useToast()

  useEffect(() => {
    let mounted = true

    async function cargar() {
      try {
        setLoading(true)
        
        const { desde, hasta } = getFechasFromAnioSemestre(anio, semestre)
        
        if (!desde || !hasta) {
          if (mounted) setStats(null)
          return
        }
        
        const data = await loadEstadisticas({ desde, hasta })
        if (mounted) {
          setStats(data)
          setError(null)
        }
      } catch (e) {
        console.error('Error cargando estadísticas:', e)
        if (mounted) setError(e.message)
        push({ type: 'error', title: 'Error en estadísticas', message: e?.message || 'Fallo de red' })
      } finally {
        if (mounted) setLoading(false)
      }
    }
    
    cargar()

    const off = onDataUpdated(() => {
      cargar()
    })

    return () => {
      mounted = false
      off()
    }
  }, [anio, semestre, push])

  /* =========================
     DATOS PARA GRÁFICOS
  ========================== */

  const dataTipo = useMemo(() => {
    return stats?.charts?.porTip?.map(item => ({
      name: item.tipificacion,
      value: Number(item.total),
    })) ?? []
  }, [stats])

  const dataCursos = useMemo(() => {
    return stats?.charts?.porCurso?.map(item => ({
      curso: item.curso,
      total: Number(item.total),
    })) ?? []
  }, [stats])

  const dataMeses = useMemo(() => {
    return stats?.charts?.porMes?.map(item => ({
      mes: item.mes,
      total: Number(item.total),
    })) ?? []
  }, [stats])

  /* =========================
     AÑOS DISPONIBLES (2025, 2026, etc.)
  ========================== */

  const aniosDisponibles = useMemo(() => {
    const ahora = new Date()
    const anioActual = ahora.getFullYear()
    // Mostrar últimos 5 años y el actual
    return Array.from({ length: 6 }, (_, i) => String(anioActual - i)).reverse()
  }, [])

  // Seleccionar año por defecto
  useEffect(() => {
    if (!anio && aniosDisponibles.length) {
      setAnio(aniosDisponibles[aniosDisponibles.length - 1])
    }
  }, [aniosDisponibles, anio])

  /* =========================
     KPI OPERATIVOS (LOS QUE YA TENÍAS)
  ========================== */

  /* =========================
     KPI OPERATIVOS
  ========================== */

  const kpi = stats?.kpis ?? { casos_total: 0, abiertos: 0, cerrados: 0, promedio_cierre_dias: 0 }
  const plazos = stats?.plazos ?? { total_plazos: 0, fuera_plazo: 0, dentro_plazo: 0, cumplimiento_pct: 0 }
  const reincidencia = stats?.reincidencia ?? 0
  const reincidentesList = stats?.reincidentes ?? []
  const navigate = useNavigate()
  const mayorCarga = stats?.mayorCarga ?? { responsable: 'Sin responsable', total: 0 }
  const mayorNivel = stats?.mayorNivel ?? { level: 'Desconocido', total: 0 }
  const promedioSeguimientos = stats?.promedioSeguimientos ?? { promedio: 0 }
  const promedioDiasPrimerSeguimiento = stats?.promedioDiasPrimerSeguimiento ?? { promedio_dias: 0 }

  const cumplimientoPlazo = plazos.cumplimiento_pct

  // Carga por responsable
  const cargaPorResponsable = mayorCarga.total > 0 ? [mayorCarga] : []

  // Tiempo promedio por etapas - no disponible
  const tiempoPromedioEtapas = []

  // Generar colores únicos por curso
  const coloresCursos = useMemo(() => {
    const cursos = dataCursos.map(d => d.curso)
    const colores = {}

    // Use TIPOS_COLORS palette cyclically for course bars to keep visual consistency
    const tipoPalette = Object.values(TIPOS_COLORS)

    cursos.forEach((curso, index) => {
      colores[curso] = tipoPalette[index % tipoPalette.length]
    })

    return colores
  }, [dataCursos])

  /* =========================
     RENDER
  ========================== */

    if (loading) return <EstadisticasSkeleton />
  if (error) return <p className="text-red-500">Error al cargar datos: {error}</p>

  /* =========================
     EXPORT PDF
  ========================== */

  const handleExportPDF = async () => {
    try {
      const [{ pdf }, { default: EstadisticasDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('../components/EstadisticasDocument'),
      ])
      const { desde, hasta } = getFechasFromAnioSemestre(anio, semestre)
      
      const blob = await pdf(
        <EstadisticasDocument
          kpi={{
            total: kpi.casos_total || 0,
            abiertos: kpi.abiertos || 0,
            cerrados: kpi.cerrados || 0,
            promedio: kpi.promedio_cierre_dias ?? null
          }}
          cumplimientoPlazo={cumplimientoPlazo}
          fueraDePlazo={Array.from({ length: plazos.fuera_plazo || 0 })}
          seguimientosConPlazo={Array.from({ length: plazos.total_plazos || 0 })}
          reincidencia={reincidentesList}
          cargaPorResponsable={cargaPorResponsable}
          tiempoPromedioEtapas={tiempoPromedioEtapas}
          dataTipo={dataTipo}
          dataCursos={dataCursos}
          filtros={{
            desde,
            hasta,
            semestre,
            curso: cursoSeleccionado || 'Todos'
          }}
        />
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Estadisticas_${anio}_${new Date().toISOString().slice(0, 10)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error al generar PDF:', err)
      alert('Error al generar el PDF')
    }
  }

  return (
    <div className="container space-y-8 print-container">
      <div className="flex justify-between items-start">
        <h1 className="text-2xl font-bold">
          Estadísticas de Convivencia Escolar
        </h1>
        <button
          onClick={handleExportPDF}
          className="btn-primary bg-blue-600 hover:bg-blue-700 transition shadow-sm px-4 py-2"
        >
          Exportar PDF
        </button>
      </div>

      {/* FILTROS */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Año
            </label>
            <select
              value={anio}
              onChange={e => setAnio(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Todos</option>
              {aniosDisponibles.map(y => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Semestre
            </label>
            <select
              value={semestre}
              onChange={e => setSemestre(e.target.value)}
              className="w-full border rounded px-3 py-2"
              disabled={!anio}
            >
              <option value="Todos">Año completo</option>
              <option value="1">Primer semestre</option>
              <option value="2">Segundo semestre</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI OPERATIVOS */}
      <div className="grid grid-cols-4 gap-4">
        {(() => {
          const kpiItems = [
            { label: 'Casos', value: kpi.casos_total },
            { label: 'Abiertos', value: kpi.abiertos },
            { label: 'Cerrados', value: kpi.cerrados },
            { label: '⏱ Promedio cierre', value: kpi.promedio_cierre_dias ?? '—', suffix: 'días' }
          ]

          const palette = Object.values(TIPOS_COLORS)

          return kpiItems.map((item, idx) => (
            <div key={item.label} className="card p-4 flex">
              <div className="w-1.5 rounded-l" style={{ background: palette[idx % palette.length] }} />
              <div className="flex-1 pl-3">
                <p className="text-xs">{item.label}</p>
                <p className="text-2xl font-bold">{item.value} {item.suffix || ''}</p>
              </div>
            </div>
          ))
        })()}
      </div>

      {/* KPI DIRECTIVOS */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-xs">Cumplimiento de plazos</p>
          <p className="text-2xl font-bold">{cumplimientoPlazo}%</p>
          <p className="text-xs text-gray-500">
            {plazos.fuera_plazo} fuera de plazo
          </p>
        </div>

        <div className="card p-4">
          <p className="text-xs">Reincidencia</p>
          <p className="text-2xl font-bold">{reincidencia}</p>
          <p className="text-xs text-gray-500">
            estudiantes con ≥ 2 casos
          </p>
        </div>

        <div className="bg-white border p-4 rounded">
          <p className="text-xs">Mayor carga</p>
          <p className="text-2xl font-bold">
            {mayorCarga.total ?? 0}
          </p>
          <p className="text-xs text-gray-500">
            {mayorCarga.responsable ?? '—'}
          </p>
        </div>

        <div className="bg-white border p-4 rounded">
          <p className="text-xs">Nivel con más casos</p>
          <p className="text-2xl font-bold">{mayorNivel.total ?? 0}</p>
          <p className="text-xs text-gray-500">{mayorNivel.level ?? '—'}</p>
        </div>

        <div className="bg-white border p-4 rounded">
          <p className="text-xs">Promedio seguimientos por caso</p>
          <p className="text-2xl font-bold">{Number(promedioSeguimientos.promedio ?? 0).toFixed(1)}</p>
          <p className="text-xs text-gray-500">media de seguimientos</p>
        </div>

        <div className="bg-white border p-4 rounded">
          <p className="text-xs">Días hasta primer seguimiento</p>
          <p className="text-2xl font-bold">{Number(promedioDiasPrimerSeguimiento.promedio_dias ?? 0).toFixed(1)}</p>
          <p className="text-xs text-gray-500">promedio desde incidente</p>
        </div>
      </div>

      {/* GRÁFICOS (LOS TUYOS) */}
      <div className="grid grid-cols-2 gap-6">
        {/* REINCIDENTES — lista de estudiantes con >=2 casos */}
        {reincidentesList.length > 0 && (
          <div className="card p-4 col-span-2">
            <h3 className="font-semibold text-gray-900 mb-3">Estudiantes con Reincidencia</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-gray-500">
                  <tr>
                    <th className="pb-2">Estudiante</th>
                    <th className="pb-2 text-right">Casos</th>
                  </tr>
                </thead>
                <tbody>
                  {reincidentesList.slice(0, 50).map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="py-2">
                        <button
                          onClick={() => navigate(`/seguimientos?estudiante=${encodeURIComponent(r.estudiante)}`)}
                          className="text-left text-sm text-blue-600 hover:underline"
                        >
                          {r.estudiante}
                        </button>
                      </td>
                      <td className="py-2 text-right font-semibold">{r.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <div className="card p-4">
          <h3>Casos por mes</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dataMeses}>
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Line dataKey="total" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-4">
          <h3>Casos por tipificación</h3>
          <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
            {/* Legend using the same color mapping */}
            {Object.entries(TIPOS_COLORS).map(([name, color]) => (
              <div key={name} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: color }} />
                <span>{name}</span>
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie 
                data={dataTipo} 
                dataKey="value" 
                nameKey="name" 
                outerRadius={80} 
                label={(entry) => entry.name}
                labelLine={false}
              >
                {dataTipo.map((entry, i) => (
                  <Cell key={i} fill={TIPOS_COLORS[entry.name] || COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [`${value} casos`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-4 col-span-2">
          <h3>Casos por curso</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dataCursos}>
              <XAxis dataKey="curso" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="total"
                onClick={d => setCursoSeleccionado(d.curso)}
              >
                {dataCursos.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={coloresCursos[entry.curso]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  )
}

function EstadisticasSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-8 w-64 bg-gray-200 rounded" />
        <div className="h-10 w-32 bg-gray-200 rounded" />
      </div>
      <div className="bg-white border rounded-xl p-6 space-y-3">
        <div className="h-5 w-32 bg-gray-200 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-10 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-20 bg-gray-200 rounded" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="h-64 bg-gray-200 rounded" />
        <div className="h-64 bg-gray-200 rounded" />
      </div>
    </div>
  )
}
