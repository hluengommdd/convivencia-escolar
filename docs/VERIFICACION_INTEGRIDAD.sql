-- ========================================
-- SCRIPT DE VERIFICACIÓN DE INTEGRIDAD
-- Ejecutar ANTES y DESPUÉS del fix
-- ========================================

-- ========================================
-- SECCIÓN 1: CONFIGURACIÓN DE STAGE_SLA
-- ========================================

SELECT 
  '1️⃣ STAGE_SLA' as seccion,
  'Configuración de plazos por etapa' as descripcion;

SELECT 
  stage_key,
  days_to_due,
  CASE 
    WHEN days_to_due IS NULL OR days_to_due = 0 THEN '❌ FALTA'
    ELSE '✅ OK'
  END as status
FROM public.stage_sla
ORDER BY 
  CASE stage_key
    WHEN '1. Comunicación/Denuncia' THEN 1
    WHEN '2. Notificación Apoderados' THEN 2
    WHEN '3. Recopilación Antecedentes' THEN 3
    WHEN '4. Entrevistas' THEN 4
    WHEN '5. Investigación/Análisis' THEN 5
    WHEN '6. Resolución y Sanciones' THEN 6
    WHEN '7. Apelación/Recursos' THEN 7
    WHEN '8. Seguimiento' THEN 8
    ELSE 99
  END;

-- Resumen
SELECT 
  COUNT(*) as total_etapas,
  COUNT(days_to_due) as etapas_configuradas,
  COUNT(*) - COUNT(days_to_due) as etapas_sin_configurar,
  CASE 
    WHEN COUNT(*) = COUNT(days_to_due) THEN '✅ COMPLETO'
    ELSE '❌ INCOMPLETO'
  END as estado
FROM public.stage_sla;


-- ========================================
-- SECCIÓN 2: SEGUIMIENTOS DUPLICADOS
-- ========================================

SELECT 
  '2️⃣ SEGUIMIENTOS DUPLICADOS' as seccion,
  'Detectar registros repetidos por caso/fecha/etapa' as descripcion;

-- Por caso/fecha/etapa
WITH duplicados AS (
  SELECT 
    case_id,
    action_date,
    process_stage,
    COUNT(*) as cantidad
  FROM public.case_followups
  WHERE process_stage IS NOT NULL
  GROUP BY case_id, action_date, process_stage
  HAVING COUNT(*) > 1
)
SELECT 
  d.case_id,
  d.action_date,
  d.process_stage,
  d.cantidad,
  c.status as estado_caso,
  '❌ DUPLICADO' as problema
FROM duplicados d
LEFT JOIN public.cases c ON d.case_id = c.id
ORDER BY d.cantidad DESC, d.case_id, d.action_date;

-- Resumen
SELECT 
  COUNT(DISTINCT case_id) as casos_con_duplicados,
  SUM(cantidad - 1) as seguimientos_extra,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ SIN DUPLICADOS'
    ELSE '❌ HAY DUPLICADOS'
  END as estado
FROM (
  SELECT case_id, COUNT(*) as cantidad
  FROM public.case_followups
  GROUP BY case_id, action_date, process_stage
  HAVING COUNT(*) > 1
) sub;


-- ========================================
-- SECCIÓN 3: SEGUIMIENTOS AUTOMÁTICOS BASURA
-- ========================================

SELECT 
  '3️⃣ SEGUIMIENTOS BACKFILL' as seccion,
  'Registros automáticos del sistema (backfill)' as descripcion;

SELECT 
  cf.case_id,
  c.status as estado_caso,
  cf.action_date,
  cf.responsible,
  cf.description,
  cf.created_at,
  '⚠️ BACKFILL' as tipo
FROM public.case_followups cf
LEFT JOIN public.cases c ON cf.case_id = c.id
WHERE cf.responsible = 'Sistema'
  AND cf.description LIKE '%backfill puntual%'
ORDER BY cf.case_id, cf.created_at;

-- Resumen
SELECT 
  COUNT(*) as total_seguimientos_backfill,
  COUNT(DISTINCT case_id) as casos_afectados,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ LIMPIO'
    WHEN COUNT(*) <= 10 THEN '⚠️ POCOS'
    ELSE '❌ MUCHOS'
  END as estado
FROM public.case_followups
WHERE responsible = 'Sistema'
  AND description LIKE '%backfill puntual%';


-- ========================================
-- SECCIÓN 4: CASOS CERRADOS SIN TIMESTAMP
-- ========================================

SELECT 
  '4️⃣ CASOS CERRADOS' as seccion,
  'Casos con status=Cerrado pero closed_at=NULL' as descripcion;

SELECT 
  id,
  incident_date,
  status,
  closed_at,
  updated_at,
  '❌ SIN TIMESTAMP' as problema
FROM public.cases
WHERE status = 'Cerrado'
  AND closed_at IS NULL
ORDER BY updated_at DESC;

-- Resumen
SELECT 
  COUNT(*) as total_cerrados,
  COUNT(closed_at) as con_timestamp,
  COUNT(*) - COUNT(closed_at) as sin_timestamp,
  CASE 
    WHEN COUNT(*) = COUNT(closed_at) THEN '✅ COMPLETO'
    ELSE '❌ INCOMPLETO'
  END as estado
FROM public.cases
WHERE status = 'Cerrado';


-- ========================================
-- SECCIÓN 5: CASOS ACTIVOS SIN DUE_DATE
-- ========================================

SELECT 
  '5️⃣ PLAZOS DE CASOS ACTIVOS' as seccion,
  'Casos con proceso iniciado sin indagacion_due_date' as descripcion;

SELECT 
  c.id,
  c.incident_date,
  c.seguimiento_started_at,
  c.indagacion_due_date,
  c.status,
  CASE 
    WHEN c.indagacion_due_date IS NULL THEN '❌ SIN DUE_DATE'
    ELSE '✅ OK'
  END as estado
FROM public.cases c
WHERE c.seguimiento_started_at IS NOT NULL
  AND c.status != 'Cerrado'
ORDER BY c.seguimiento_started_at DESC;

-- Resumen
SELECT 
  COUNT(*) as total_activos_con_proceso,
  COUNT(indagacion_due_date) as con_due_date,
  COUNT(*) - COUNT(indagacion_due_date) as sin_due_date,
  CASE 
    WHEN COUNT(*) = COUNT(indagacion_due_date) THEN '✅ COMPLETO'
    ELSE '❌ INCOMPLETO'
  END as estado
FROM public.cases
WHERE seguimiento_started_at IS NOT NULL
  AND status != 'Cerrado';


-- ========================================
-- SECCIÓN 6: FOLLOWUPS SIN DUE_DATE
-- ========================================

SELECT 
  '6️⃣ PLAZOS DE FOLLOWUPS' as seccion,
  'Seguimientos con etapa pero sin due_date correcto' as descripcion;

SELECT 
  cf.id,
  cf.case_id,
  cf.action_date,
  cf.process_stage,
  cf.due_date,
  s.days_to_due,
  CASE 
    WHEN s.days_to_due IS NULL THEN '⚠️ Etapa sin días'
    WHEN cf.due_date IS NULL THEN '❌ Sin due_date'
    WHEN cf.due_date = cf.action_date AND s.days_to_due > 0 THEN '❌ Due = action'
    ELSE '✅ OK'
  END as estado
FROM public.case_followups cf
LEFT JOIN public.stage_sla s ON cf.process_stage = s.stage_key
WHERE cf.process_stage IS NOT NULL
  AND cf.action_date IS NOT NULL
ORDER BY 
  CASE 
    WHEN s.days_to_due IS NULL THEN 1
    WHEN cf.due_date IS NULL THEN 2
    WHEN cf.due_date = cf.action_date AND s.days_to_due > 0 THEN 3
    ELSE 4
  END,
  cf.case_id, cf.action_date;

-- Resumen
SELECT 
  COUNT(*) as total_followups_con_etapa,
  COUNT(CASE WHEN cf.due_date IS NOT NULL THEN 1 END) as con_due_date,
  COUNT(CASE WHEN cf.due_date IS NULL THEN 1 END) as sin_due_date,
  COUNT(CASE 
    WHEN cf.due_date = cf.action_date 
      AND s.days_to_due IS NOT NULL 
      AND s.days_to_due > 0 
    THEN 1 
  END) as due_igual_action,
  CASE 
    WHEN COUNT(*) = COUNT(cf.due_date) 
      AND COUNT(CASE WHEN cf.due_date = cf.action_date THEN 1 END) = 0
    THEN '✅ COMPLETO'
    ELSE '❌ REVISAR'
  END as estado
FROM public.case_followups cf
LEFT JOIN public.stage_sla s ON cf.process_stage = s.stage_key
WHERE cf.process_stage IS NOT NULL
  AND cf.action_date IS NOT NULL;


-- ========================================
-- SECCIÓN 7: CASOS SIN SEGUIMIENTOS
-- ========================================

SELECT 
  '7️⃣ CASOS SIN SEGUIMIENTOS' as seccion,
  'Casos con proceso iniciado pero sin registros de seguimiento' as descripcion;

SELECT 
  c.id,
  c.incident_date,
  c.seguimiento_started_at,
  c.status,
  COUNT(cf.id) as cantidad_seguimientos,
  CASE 
    WHEN COUNT(cf.id) = 0 THEN '⚠️ SIN SEGUIMIENTOS'
    ELSE '✅ OK'
  END as estado
FROM public.cases c
LEFT JOIN public.case_followups cf ON c.id = cf.case_id
WHERE c.seguimiento_started_at IS NOT NULL
GROUP BY c.id, c.incident_date, c.seguimiento_started_at, c.status
HAVING COUNT(cf.id) = 0
ORDER BY c.seguimiento_started_at DESC;

-- Resumen
SELECT 
  COUNT(DISTINCT c.id) as casos_con_proceso,
  COUNT(DISTINCT CASE WHEN cf.id IS NULL THEN c.id END) as sin_seguimientos,
  CASE 
    WHEN COUNT(DISTINCT CASE WHEN cf.id IS NULL THEN c.id END) = 0 
    THEN '✅ TODOS CON SEGUIMIENTOS'
    ELSE '⚠️ REVISAR'
  END as estado
FROM public.cases c
LEFT JOIN public.case_followups cf ON c.id = cf.case_id
WHERE c.seguimiento_started_at IS NOT NULL;


-- ========================================
-- RESUMEN GENERAL
-- ========================================

SELECT '📊 RESUMEN GENERAL' as titulo;

WITH checks AS (
  SELECT 
    '1. Stage SLA' as check_name,
    CASE WHEN COUNT(*) = COUNT(days_to_due) THEN '✅' ELSE '❌' END as status,
    COUNT(*) - COUNT(days_to_due) as problemas
  FROM public.stage_sla
  
  UNION ALL
  
  SELECT 
    '2. Seguimientos duplicados',
    CASE WHEN COUNT(*) = 0 THEN '✅' ELSE '❌' END,
    COUNT(*)
  FROM (
    SELECT case_id
    FROM public.case_followups
    GROUP BY case_id, action_date, process_stage
    HAVING COUNT(*) > 1
  ) dup
  
  UNION ALL
  
  SELECT 
    '3. Seguimientos backfill',
    CASE WHEN COUNT(*) = 0 THEN '✅' ELSE '⚠️' END,
    COUNT(*)
  FROM public.case_followups
  WHERE responsible = 'Sistema'
    AND description LIKE '%backfill puntual%'
  
  UNION ALL
  
  SELECT 
    '4. Casos cerrados sin timestamp',
    CASE WHEN COUNT(*) = 0 THEN '✅' ELSE '❌' END,
    COUNT(*)
  FROM public.cases
  WHERE status = 'Cerrado' AND closed_at IS NULL
  
  UNION ALL
  
  SELECT 
    '5. Casos activos sin due_date',
    CASE WHEN COUNT(*) = 0 THEN '✅' ELSE '❌' END,
    COUNT(*)
  FROM public.cases
  WHERE seguimiento_started_at IS NOT NULL
    AND status != 'Cerrado'
    AND indagacion_due_date IS NULL
  
  UNION ALL
  
  SELECT 
    '6. Followups sin due_date correcto',
    CASE 
      WHEN COUNT(CASE WHEN cf.due_date IS NULL OR cf.due_date = cf.action_date THEN 1 END) = 0 
      THEN '✅' 
      ELSE '❌' 
    END,
    COUNT(CASE WHEN cf.due_date IS NULL OR cf.due_date = cf.action_date THEN 1 END)
  FROM public.case_followups cf
  LEFT JOIN public.stage_sla s ON cf.process_stage = s.stage_key
  WHERE cf.process_stage IS NOT NULL
    AND s.days_to_due IS NOT NULL
    AND s.days_to_due > 0
)
SELECT 
  check_name as "📋 Verificación",
  status as "Estado",
  problemas as "Problemas encontrados"
FROM checks
ORDER BY check_name;


-- ========================================
-- SCORE FINAL
-- ========================================

WITH checks AS (
  SELECT COUNT(*) = COUNT(days_to_due) as ok FROM public.stage_sla
  UNION ALL
  SELECT COUNT(*) = 0 FROM (
    SELECT case_id FROM public.case_followups
    GROUP BY case_id, action_date, process_stage
    HAVING COUNT(*) > 1
  ) dup
  UNION ALL
  SELECT COUNT(*) = 0 FROM public.cases
  WHERE status = 'Cerrado' AND closed_at IS NULL
  UNION ALL
  SELECT COUNT(*) = 0 FROM public.cases
  WHERE seguimiento_started_at IS NOT NULL
    AND status != 'Cerrado'
    AND indagacion_due_date IS NULL
)
SELECT 
  '🎯 SCORE FINAL' as titulo,
  CONCAT(
    COUNT(CASE WHEN ok THEN 1 END), 
    ' / ', 
    COUNT(*),
    ' checks OK'
  ) as resultado,
  CASE 
    WHEN COUNT(CASE WHEN ok THEN 1 END) = COUNT(*) THEN '🎉 PERFECTO'
    WHEN COUNT(CASE WHEN ok THEN 1 END) >= COUNT(*) * 0.75 THEN '✅ BUENO'
    WHEN COUNT(CASE WHEN ok THEN 1 END) >= COUNT(*) * 0.5 THEN '⚠️ REVISAR'
    ELSE '❌ CRÍTICO'
  END as estado
FROM checks;


-- ========================================
-- INSTRUCCIONES
-- ========================================

/*
📝 CÓMO USAR ESTE SCRIPT:

1. ANTES DEL FIX:
   - Ejecutar todo el script
   - Guardar los resultados como referencia
   - Anotar el "SCORE FINAL"

2. APLICAR FIX:
   - Ejecutar FIX_DATOS_SUPABASE.sql

3. DESPUÉS DEL FIX:
   - Ejecutar nuevamente este script
   - Comparar con resultados anteriores
   - Verificar que el score mejoró

4. SCORE ESPERADO DESPUÉS DEL FIX:
   - ✅ Stage SLA: 0 problemas
   - ✅ Duplicados: 0 problemas
   - ✅ Backfill: 0 problemas (Opción A) o reducidos (Opción B)
   - ✅ Casos cerrados: 0 problemas
   - ✅ Due dates: 0 problemas
   - 🎯 Score Final: 100% (6/6 checks OK)

5. SI ALGO FALLA:
   - Revisar la sección específica que falló
   - Ejecutar los queries individuales para diagnosticar
   - Consultar GUIA_CORRECCION_DATOS.md
*/
