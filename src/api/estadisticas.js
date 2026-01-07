import { supabase } from './supabaseClient'
import { withRetry } from './withRetry'

const EMPTY_STATS = {
  kpis: { casos_total: 0, abiertos: 0, cerrados: 0, promedio_cierre_dias: 0 },
  plazos: { total_plazos: 0, fuera_plazo: 0, dentro_plazo: 0, cumplimiento_pct: 0 },
  reincidencia: 0,
  mayorCarga: { responsable: 'Sin responsable', total: 0 },
  mayorNivel: { level: 'Desconocido', total: 0 },
  charts: { porMes: [], porTip: [], porCurso: [] },
}

function pickSingle(rowArray, fallback) {
  return rowArray?.[0] ?? fallback
}

/**
 * Cargar todas las estadísticas en rango de fechas
 * @param {string} desde - Fecha inicio (YYYY-MM-DD)
 * @param {string} hasta - Fecha fin (YYYY-MM-DD)
 * @returns {Promise<Object>}
 */
export async function loadEstadisticas({ desde, hasta }) {
  try {
    console.log('📊 Cargando estadísticas:', { desde, hasta })

    // Validación: no enviar null a RPC
    if (!desde || !hasta) {
      console.warn('⚠️ Fechas vacías, retornando datos por defecto')
      return EMPTY_STATS
    }

    // Ejecutar todas las RPC en paralelo para mejor rendimiento
    const [
      kpisRes,
      plazosRes,
      reincRes,
      cargaRes,
      mayorNivelRes,
      porMesRes,
      porTipRes,
      porCursoRes,
    ] = await Promise.all([
      withRetry(() => supabase.rpc('stats_kpis', { desde, hasta })),
      withRetry(() => supabase.rpc('stats_cumplimiento_plazos', { desde, hasta })),
      withRetry(() => supabase.rpc('stats_reincidencia', { desde, hasta })),
      withRetry(() => supabase.rpc('stats_mayor_carga', { desde, hasta })),
      withRetry(() => supabase.rpc('stats_mayor_nivel', { desde, hasta })),
      withRetry(() => supabase.rpc('stats_casos_por_mes', { desde, hasta })),
      withRetry(() => supabase.rpc('stats_casos_por_tipificacion', { desde, hasta })),
      withRetry(() => supabase.rpc('stats_casos_por_curso', { desde, hasta })),
    ])

    // Manejo de errores consolidado
    const errors = [
      kpisRes.error,
      plazosRes.error,
      reincRes.error,
      cargaRes.error,
      mayorNivelRes.error,
      porMesRes.error,
      porTipRes.error,
      porCursoRes.error,
    ].filter(Boolean)

    if (errors.length) {
      throw new Error(`Error en RPC: ${errors[0].message}`)
    }

    // Extraer datos con valores por defecto
    const kpis = pickSingle(kpisRes.data, EMPTY_STATS.kpis)
    const plazos = pickSingle(plazosRes.data, EMPTY_STATS.plazos)
    const reincRow = pickSingle(reincRes.data, { estudiantes_reincidentes: 0 })
    const reincidencia = reincRow?.estudiantes_reincidentes ?? 0
    const mayorCarga = pickSingle(cargaRes.data, EMPTY_STATS.mayorCarga)
    const mayorNivel = pickSingle(mayorNivelRes.data, EMPTY_STATS.mayorNivel)

    console.log('✅ Estadísticas cargadas:', { kpis, plazos, reincidencia, mayorCarga })

    return {
      kpis,
      plazos,
      reincidencia,
      mayorCarga,
      mayorNivel,
      charts: {
        porMes: porMesRes.data ?? EMPTY_STATS.charts.porMes,
        porTip: porTipRes.data ?? EMPTY_STATS.charts.porTip,
        porCurso: porCursoRes.data ?? EMPTY_STATS.charts.porCurso,
      },
    }
  } catch (error) {
    console.error('❌ Error cargando estadísticas:', error)
    throw error
  }
}

/**
 * Convertir año + semestre a fechas desde/hasta
 * @param {string|number} anio
 * @param {string} semestre - '1', '2', o 'Todos'
 * @returns {Object} { desde, hasta }
 */
export function getFechasFromAnioSemestre(anio, semestre) {
  if (!anio) {
    return { desde: null, hasta: null }
  }

  const anioNum = parseInt(anio, 10)

  if (semestre === '1') {
    // 1er semestre: 01-01 a 30-06
    return {
      desde: `${anioNum}-01-01`,
      hasta: `${anioNum}-06-30`,
    }
  } else if (semestre === '2') {
    // 2do semestre: 01-07 a 31-12
    return {
      desde: `${anioNum}-07-01`,
      hasta: `${anioNum}-12-31`,
    }
  } else {
    // Todos: año completo
    return {
      desde: `${anioNum}-01-01`,
      hasta: `${anioNum}-12-31`,
    }
  }
}
