import { useEffect, useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
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
import { useAirtable } from '../hooks/useAirtable'

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981']

/* =========================
   UTILIDADES
========================== */

const safeDate = s => {
  if (!s) return null
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

const daysBetween = (a, b) =>
  Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))

/* =========================
   COMPONENTE
========================== */

export default function Estadisticas() {
  /* =========================
     ESTADOS
  ========================== */

  const [anio, setAnio] = useState('')
  const [semestre, setSemestre] = useState('Todos')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null)

  /* =========================
     DATA
  ========================== */

  const { data: casos = [], loading, error } = useAirtable(
    'CASOS_ACTIVOS',
    'Grid view',
    anio ? `YEAR(Fecha_Incidente) = ${anio}` : undefined
  )

  const {
    data: seguimientos = [],
    loading: loadingSeg,
  } = useAirtable(
    'SEGUIMIENTOS',
    'Grid view',
    anio ? `IS_AFTER(Fecha, '${anio}-01-01')` : undefined
  )

  const isLoading = loading || loadingSeg
  const hasError = !!error

  /* =========================
     AÑOS DISPONIBLES
  ========================== */

  const aniosDisponibles = useMemo(() => {
    const set = new Set()
    casos.forEach(c => {
      const f = c.fields?.Fecha_Incidente
      if (f) set.add(f.slice(0, 4))
    })
    return Array.from(set).sort()
  }, [casos])

  useEffect(() => {
    if (!anio && aniosDisponibles.length) {
      const y = aniosDisponibles[aniosDisponibles.length - 1]
      setAnio(y)
      setDesde(`${y}-01-01`)
      setHasta(`${y}-12-31`)
    }
  }, [aniosDisponibles, anio])

  useEffect(() => {
    if (!anio) return
    if (semestre === '1') {
      setDesde(`${anio}-01-01`)
      setHasta(`${anio}-06-30`)
    } else if (semestre === '2') {
      setDesde(`${anio}-07-01`)
      setHasta(`${anio}-12-31`)
    } else {
      setDesde(`${anio}-01-01`)
      setHasta(`${anio}-12-31`)
    }
  }, [anio, semestre])

  /* =========================
     FILTRADO
  ========================== */

  const casosFiltrados = useMemo(() => {
    const dDesde = safeDate(desde)
    const dHasta = safeDate(hasta)

    return casos.filter(c => {
      const d = safeDate(c.fields?.Fecha_Incidente)
      if (!d) return false
      if (dDesde && d < dDesde) return false
      if (dHasta && d > new Date(hasta + 'T23:59:59')) return false
      if (cursoSeleccionado && c.fields?.Curso_Incidente !== cursoSeleccionado)
        return false
      return true
    })
  }, [casos, desde, hasta, cursoSeleccionado])

  const idsCasos = useMemo(
    () => new Set(casosFiltrados.map(c => c.id)),
    [casosFiltrados]
  )

  const seguimientosFiltrados = useMemo(() => {
    return seguimientos.filter(s =>
      (s.fields?.CASOS_ACTIVOS || []).some(id => idsCasos.has(id))
    )
  }, [seguimientos, idsCasos])

  /* =========================
     KPI OPERATIVOS (LOS QUE YA TENÍAS)
  ========================== */

  const kpi = useMemo(() => {
    const total = casosFiltrados.length
    const cerrados = casosFiltrados.filter(c => c.fields?.Estado === 'Cerrado')
    const abiertos = total - cerrados.length

    let sum = 0
    let n = 0

    cerrados.forEach(c => {
      const ini = safeDate(c.fields?.Fecha_Incidente)
      const fin = seguimientosFiltrados
        .filter(s => (s.fields?.CASOS_ACTIVOS || []).includes(c.id))
        .map(s => safeDate(s.fields?.Fecha))
        .filter(Boolean)
        .sort((a, b) => b - a)[0]

      if (ini && fin) {
        sum += daysBetween(ini, fin)
        n++
      }
    })

    return {
      total,
      abiertos,
      cerrados: cerrados.length,
      promedio: n > 0 ? Math.round((sum / n) * 10) / 10 : null,
    }
  }, [casosFiltrados, seguimientosFiltrados])

  /* =========================
     KPI DIRECTIVOS (NUEVOS)
  ========================== */

  const seguimientosConPlazo = seguimientosFiltrados.filter(
    s => typeof s.fields?.Dias_Restantes === 'number'
  )

  const fueraDePlazo = seguimientosConPlazo.filter(
    s => s.fields.Dias_Restantes < 0
  )

  const cumplimientoPlazo =
    seguimientosConPlazo.length > 0
      ? Math.round(
          ((seguimientosConPlazo.length - fueraDePlazo.length) /
            seguimientosConPlazo.length) *
            100
        )
      : 100

  // Reincidencia
  const reincidencia = useMemo(() => {
    const map = {}
    casosFiltrados.forEach(c => {
      const e = c.fields?.Estudiante_Responsable
      if (!e) return
      map[e] = (map[e] || 0) + 1
    })
    return Object.entries(map)
      .filter(([, n]) => n >= 2)
      .map(([estudiante, total]) => ({ estudiante, total }))
  }, [casosFiltrados])

  // Carga por responsable
  const cargaPorResponsable = useMemo(() => {
    const map = {}
    seguimientosFiltrados.forEach(s => {
      const r = s.fields?.Responsable || 'Sin asignar'
      map[r] = (map[r] || 0) + 1
    })
    return Object.entries(map)
      .map(([responsable, total]) => ({ responsable, total }))
      .sort((a, b) => b.total - a.total)
  }, [seguimientosFiltrados])

  /* =========================
     GRÁFICOS (IGUALES A LOS TUYOS)
  ========================== */

  const dataMes = useMemo(() => {
    const m = {}
    casosFiltrados.forEach(c => {
      const mes = c.fields?.Fecha_Incidente?.slice(0, 7)
      if (mes) m[mes] = (m[mes] || 0) + 1
    })
    return Object.keys(m).map(k => ({ mes: k, total: m[k] }))
  }, [casosFiltrados])

  const dataTipo = useMemo(() => {
    const t = {}
    casosFiltrados.forEach(c => {
      const k = c.fields?.Tipificacion_Conducta || 'Sin dato'
      t[k] = (t[k] || 0) + 1
    })
    return Object.keys(t).map(k => ({ name: k, value: t[k] }))
  }, [casosFiltrados])

  const dataCursos = useMemo(() => {
    const c = {}
    casosFiltrados.forEach(x => {
      const k = x.fields?.Curso_Incidente || 'Sin curso'
      c[k] = (c[k] || 0) + 1
    })
    return Object.keys(c).map(k => ({ curso: k, total: c[k] }))
  }, [casosFiltrados])

  /* =========================
     RENDER
  ========================== */

  if (isLoading) return <p className="text-gray-500">Cargando estadísticas…</p>
  if (hasError) return <p className="text-red-500">Error al cargar datos</p>

  return (
    <div className="space-y-8 print-container">
      <div className="flex justify-between items-start">
        <h1 className="text-2xl font-bold">
          Estadísticas de Convivencia Escolar
        </h1>
        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Desde
            </label>
            <input
              type="date"
              value={desde}
              onChange={e => setDesde(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hasta
            </label>
            <input
              type="date"
              value={hasta}
              onChange={e => setHasta(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        {cursoSeleccionado && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Filtrando por curso: <strong>{cursoSeleccionado}</strong>
            </span>
            <button
              onClick={() => setCursoSeleccionado(null)}
              className="text-sm text-blue-600 hover:underline"
            >
              Limpiar filtro
            </button>
          </div>
        )}
      </div>

      {/* KPI OPERATIVOS */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border p-4 rounded">
          <p className="text-xs">Casos</p>
          <p className="text-2xl font-bold">{kpi.total}</p>
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
          <p className="text-2xl font-bold">{kpi.promedio ?? '—'} días</p>
        </div>
      </div>

      {/* KPI DIRECTIVOS */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border p-4 rounded">
          <p className="text-xs">Cumplimiento de plazos</p>
          <p className="text-2xl font-bold">{cumplimientoPlazo}%</p>
          <p className="text-xs text-gray-500">
            {fueraDePlazo.length} fuera de plazo
          </p>
        </div>

        <div className="bg-white border p-4 rounded">
          <p className="text-xs">Reincidencia</p>
          <p className="text-2xl font-bold">{reincidencia.length}</p>
          <p className="text-xs text-gray-500">
            estudiantes con ≥ 2 casos
          </p>
        </div>

        <div className="bg-white border p-4 rounded">
          <p className="text-xs">Mayor carga</p>
          <p className="text-2xl font-bold">
            {cargaPorResponsable[0]?.total ?? 0}
          </p>
          <p className="text-xs text-gray-500">
            {cargaPorResponsable[0]?.responsable ?? '—'}
          </p>
        </div>
      </div>

      {/* GRÁFICOS (LOS TUYOS) */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border p-4 min-h-[18rem] rounded">
          <h3>Casos por mes</h3>
          <ResponsiveContainer>
            <LineChart data={dataMes}>
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Line dataKey="total" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border p-4 min-h-[18rem] rounded">
          <h3>Casos por tipificación</h3>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={dataTipo} dataKey="value" nameKey="name" label>
                {dataTipo.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border p-4 min-h-[18rem] rounded col-span-2">
          <h3>Casos por curso</h3>
          <ResponsiveContainer>
            <BarChart data={dataCursos}>
              <XAxis dataKey="curso" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="total"
                fill="#ef4444"
                onClick={d => setCursoSeleccionado(d.curso)}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
