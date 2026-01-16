-- ========================================
-- SCRIPT DE CORRECCIÓN DE DATOS SUPABASE
-- Fecha: 2026-01-16
-- PROBLEMAS REALES DETECTADOS
-- ========================================

/*
PROBLEMAS IDENTIFICADOS DESPUÉS DE REVISAR DATOS REALES:

1. ✅ stage_sla.days_to_due: Stages 3 y 4 tienen NULL
   - Afecta cálculo de due_dates en case_followups
   
2. ✅ RPC start_due_process: Solo maneja status 'Activo'
   - No actualiza casos con status 'Reportado'
   - Trinidad quedó atrapado con status "Reportado"
   
3. ✅ case_followups.process_stage: Campo esperado que no existe
   - Usa "process_stage" en creación pero tiene "detail" y otros
   
4. ✅ Muchos casos con status = 'Cerrado' pero no cerrados realmente
   - seguimiento_started_at NULL para casos que parecen iniciados
   
5. ✅ RPC no verifica coalesce() correctamente en algunos campos
   - Los campos deberían usar coalesce() para no sobrescribir
*/

-- ========================================
-- PASO 1: ARREGLAR stage_sla
-- ========================================
-- Las etapas "3. Recopilación Antecedentes" y "4. Entrevistas" 
-- necesitan días configurados

UPDATE public.stage_sla
SET days_to_due = 3
WHERE stage_key = '3. Recopilación Antecedentes';

UPDATE public.stage_sla
SET days_to_due = 5
WHERE stage_key = '4. Entrevistas';

-- Verificar configuración completa
SELECT 
  stage_key,
  days_to_due,
  CASE 
    WHEN days_to_due IS NULL THEN '❌ FALTA CONFIGURAR'
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


-- ========================================
-- PROBLEMA 2: Seguimientos automáticos duplicados
-- ========================================
-- Hay múltiples registros de "Inicio automático" creados por backfill
-- que ensucian el timeline y confunden al usuario

-- Ver cuántos seguimientos basura hay por caso
SELECT 
  case_id,
  COUNT(*) as cantidad_seguimientos_basura
FROM public.case_followups
WHERE responsible = 'Sistema'
  AND description LIKE '%backfill puntual%'
  AND action_type = 'Denuncia/Reporte'
GROUP BY case_id
HAVING COUNT(*) > 1
ORDER BY cantidad_seguimientos_basura DESC;

-- OPCIÓN A: Eliminar TODOS los seguimientos de backfill automático
-- (Recomendado si fueron creados por error)
DELETE FROM public.case_followups
WHERE responsible = 'Sistema'
  AND description LIKE '%backfill puntual%'
  AND action_type = 'Denuncia/Reporte';

-- OPCIÓN B: Mantener solo el más antiguo por caso y eliminar duplicados
-- (Usar si quieres conservar el registro histórico)
WITH ranked_followups AS (
  SELECT 
    id,
    case_id,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY case_id 
      ORDER BY created_at ASC
    ) as rn
  FROM public.case_followups
  WHERE responsible = 'Sistema'
    AND description LIKE '%backfill puntual%'
    AND action_type = 'Denuncia/Reporte'
)
DELETE FROM public.case_followups
WHERE id IN (
  SELECT id 
  FROM ranked_followups 
  WHERE rn > 1
);


-- ========================================
-- PROBLEMA 3: Seguimientos Sistema duplicados (no backfill)
-- ========================================
-- Casos con múltiples seguimientos creados automáticamente el mismo día

-- Ver casos con seguimientos duplicados del Sistema
SELECT 
  case_id,
  action_date,
  COUNT(*) as cantidad
FROM public.case_followups
WHERE responsible = 'Sistema'
  AND process_stage = '1. Comunicación/Denuncia'
GROUP BY case_id, action_date
HAVING COUNT(*) > 1;

-- Eliminar duplicados manteniendo el más reciente
WITH ranked AS (
  SELECT 
    id,
    case_id,
    action_date,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY case_id, action_date, process_stage
      ORDER BY created_at DESC
    ) as rn
  FROM public.case_followups
  WHERE responsible = 'Sistema'
    AND process_stage = '1. Comunicación/Denuncia'
)
DELETE FROM public.case_followups
WHERE id IN (
  SELECT id FROM ranked WHERE rn > 1
);


-- ========================================
-- PROBLEMA 4: Casos cerrados sin timestamp
-- ========================================
-- Casos con status="Cerrado" pero closed_at = NULL

-- Ver casos con inconsistencia
SELECT 
  id,
  student_id,
  status,
  closed_at,
  updated_at
FROM public.cases
WHERE status = 'Cerrado'
  AND closed_at IS NULL;

-- Asignar closed_at = updated_at cuando falta
UPDATE public.cases
SET closed_at = updated_at
WHERE status = 'Cerrado'
  AND closed_at IS NULL;


-- ========================================
-- PROBLEMA 5: Recalcular due_dates de casos activos
-- ========================================
-- Algunos casos tienen plazos incorrectos por la falta de configuración en stage_sla

-- Ver casos sin indagacion_due_date a pesar de tener seguimiento_started_at
SELECT 
  id,
  incident_date,
  seguimiento_started_at,
  indagacion_due_date,
  status
FROM public.cases
WHERE seguimiento_started_at IS NOT NULL
  AND indagacion_due_date IS NULL
  AND status != 'Cerrado';

-- Recalcular indagacion_due_date usando add_business_days
UPDATE public.cases c
SET indagacion_due_date = (
  SELECT add_business_days(c.seguimiento_started_at::date, 10)
)
WHERE c.seguimiento_started_at IS NOT NULL
  AND c.indagacion_due_date IS NULL
  AND c.status != 'Cerrado';


-- ========================================
-- PROBLEMA 6: Recalcular due_date de followups
-- ========================================
-- Los followups con etapas sin días configurados tienen due_date = action_date

-- Ver followups con due_date potencialmente incorrecto
SELECT 
  cf.id,
  cf.case_id,
  cf.action_date,
  cf.process_stage,
  cf.due_date,
  s.days_to_due,
  CASE 
    WHEN s.days_to_due IS NULL THEN '❌ Stage sin días'
    WHEN cf.due_date = cf.action_date THEN '⚠️ Due = action (revisar)'
    ELSE '✅ OK'
  END as status
FROM public.case_followups cf
LEFT JOIN public.stage_sla s ON cf.process_stage = s.stage_key
WHERE cf.process_stage IS NOT NULL
  AND cf.action_date IS NOT NULL
ORDER BY cf.case_id, cf.action_date;

-- Recalcular due_date de followups con stage_sla actualizado
UPDATE public.case_followups cf
SET due_date = add_business_days(cf.action_date, s.days_to_due)
FROM public.stage_sla s
WHERE cf.process_stage = s.stage_key
  AND s.days_to_due IS NOT NULL
  AND s.days_to_due > 0
  AND (
    cf.due_date IS NULL 
    OR cf.due_date = cf.action_date
  );


-- ========================================
-- VERIFICACIÓN FINAL
-- ========================================

-- 1. Verificar stage_sla completo
SELECT 'Stage SLA', COUNT(*) as total, COUNT(days_to_due) as con_dias
FROM public.stage_sla;

-- 2. Verificar seguimientos únicos por caso
SELECT 'Seguimientos duplicados', COUNT(*) as total
FROM (
  SELECT case_id, action_date, process_stage, COUNT(*) as cnt
  FROM public.case_followups
  GROUP BY case_id, action_date, process_stage
  HAVING COUNT(*) > 1
) duplicados;

-- 3. Verificar casos cerrados con timestamp
SELECT 'Casos cerrados sin timestamp', COUNT(*)
FROM public.cases
WHERE status = 'Cerrado' AND closed_at IS NULL;

-- 4. Verificar casos activos con due_date
SELECT 
  'Casos activos' as tipo,
  COUNT(*) as total,
  COUNT(indagacion_due_date) as con_due_date,
  COUNT(*) - COUNT(indagacion_due_date) as sin_due_date
FROM public.cases
WHERE status != 'Cerrado'
  AND seguimiento_started_at IS NOT NULL;

-- ========================================
-- NOTAS IMPORTANTES
-- ========================================
/*
1. Ejecutar en SQL Editor de Supabase
2. Revisar cada sección antes de ejecutar
3. Hacer backup antes de DELETE/UPDATE masivos
4. La OPCIÓN A de seguimientos basura es más limpia
5. Después de ejecutar, verificar en la UI que:
   - No hay seguimientos duplicados
   - Los plazos se muestran correctamente
   - Los casos cerrados tienen timestamp
*/
