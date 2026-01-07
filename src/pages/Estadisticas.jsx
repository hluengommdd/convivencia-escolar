import { useEffect, useMemo, useState } from 'react'
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

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981']

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
    
    // Paleta de colores vibrantes
    const palette = [
      '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6',
      '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16',
      '#6366f1', '#f43f5e', '#22c55e', '#eab308', '#a855f7'
    ]
    
    cursos.forEach((curso, index) => {
      colores[curso] = palette[index % palette.length]
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
          reincidencia={typeof reincidencia === 'number' ? Array.from({ length: reincidencia }, (_, i) => ({ estudiante: `Estudiante ${i + 1}`, total: 2 })) : []}
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
    <div className="space-y-8 print-container">
      <div className="flex justify-between items-start">
        <h1 className="text-2xl font-bold">
          Estadísticas de Convivencia Escolar
        </h1>
        <button
          onClick={handleExportPDF}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm"
        >
          Exportar PDF
        </button>
      </div>

      {/* FILTROS */}
      <div className="bg-white border rounded-xl p-6">
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
        <div className="bg-white border p-4 rounded">
          <p className="text-xs">Casos</p>
          <p className="text-2xl font-bold">{kpi.casos_total}</p>
        </div>
        <div className="bg-white border p-4 rounded">
          <p className="text-xs">Abiertos</p>
          <p className="text-2xl font-bold">{kpi.abiertos}</p>
        </div>
        <div className="bg-white border p-4 rounded">
          <p className="text-xs">Cerrados</p>
          <p className="text-2xl font-bold">{kpi.cerrados}</p>
        </div>
        <div className="bg-white border p-4 rounded">
          <p className="text-xs">⏱ Promedio cierre</p>
          <p className="text-2xl font-bold">{kpi.promedio_cierre_dias ?? '—'} días</p>
        </div>
      </div>

      {/* KPI DIRECTIVOS */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border p-4 rounded">
          <p className="text-xs">Cumplimiento de plazos</p>
          <p className="text-2xl font-bold">{cumplimientoPlazo}%</p>
          <p className="text-xs text-gray-500">
            {plazos.fuera_plazo} fuera de plazo
          </p>
        </div>

        <div className="bg-white border p-4 rounded">
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
        <div className="bg-white border p-4 rounded">
          <h3>Casos por mes</h3>
          <ResponsiveContainer width={600} height={250}>
            <LineChart data={dataMeses}>
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Line dataKey="total" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border p-4 rounded">
          <h3>Casos por tipificación</h3>
          <ResponsiveContainer width={600} height={250}>
            <PieChart>
              <Pie 
                data={dataTipo} 
                dataKey="value" 
                nameKey="name" 
                outerRadius={80} 
                label={(entry) => entry.name}
                labelLine={false}
              >
                {dataTipo.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [`${value} casos`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border p-4 rounded col-span-2">
          <h3>Casos por curso</h3>
          <ResponsiveContainer width={1200} height={250}>
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
