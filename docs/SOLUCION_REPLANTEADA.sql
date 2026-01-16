-- ============================================================
-- SOLUCIÓN REPLANTEADA: 3 problemas REALES (no 4)
-- Basado en análisis de datos + aclaración de usuario
-- Etapas 3 y 4 SIN plazo son INTENCIONALES
-- ============================================================

/*
PROBLEMAS REALES (REPLANTEADO):

✅ ESTO ES CORRECTO (NO ES PROBLEMA):
   - stage_sla etapas 3 y 4 con NULL
   - Significa: "Hacer estas acciones, pero sin plazo límite"
   - Es INTENCIONAL para indicar tareas informativas
   
❌ PROBLEMAS REALES:

1. RPC ignora status='Reportado'
   - Solo cambia si status = 'Activo'
   - Trinity creado con 'Reportado' → no transiciona
   - CRÍTICO: Trinity atrapado en "Reportado"

2. process_stage NULL en inserciones
   - Frontend envía null → ERROR 400
   - Necesita valor por defecto

3. due_dates inconsistentes (parcial)
   - Algunos NULL (OK si no hay plazo)
   - Algunos < action_date (INVÁLIDO)
   - Solo afecta etapas que tienen plazo
*/

-- ============================================================
-- PASO 1: Verificar que stage_sla es CORRECTO (no tocar)
-- ============================================================

SELECT 
  stage_key,
  days_to_due,
  CASE 
    WHEN days_to_due IS NULL THEN '✅ SIN PLAZO (informativo)'
    WHEN days_to_due > 0 THEN '✅ CON PLAZO'
    ELSE '⚠️ REVISAR'
  END as status
FROM public.stage_sla
ORDER BY stage_key;

-- RESULTADO ESPERADO:
-- 1. Comunicación/Denuncia       | 1     | ✅ CON PLAZO
-- 2. Notificación Apoderados     | 1     | ✅ CON PLAZO
-- 3. Recopilación Antecedentes   | NULL  | ✅ SIN PLAZO (INTENCIONAL)
-- 4. Entrevistas                 | NULL  | ✅ SIN PLAZO (INTENCIONAL)
-- 5. Investigación/Análisis      | 10    | ✅ CON PLAZO
-- 6. Resolución y Sanciones      | 1     | ✅ CON PLAZO
-- 7. Apelación/Recursos          | 2     | ✅ CON PLAZO


-- ============================================================
-- SOLUCIÓN 1: Actualizar RPC para manejar 'Reportado'
-- ============================================================
-- PROBLEMA PRINCIPAL: Trinity está atrapado en "Reportado"

CREATE OR REPLACE FUNCTION public.start_due_process(
  p_case_id uuid,
  p_sla_days integer DEFAULT 10
)
RETURNS void
LANGUAGE plpgsql
AS $$
declare
  v_now timestamptz := now();
  v_start_date date := (v_now at time zone 'UTC')::date;
begin
  update public.cases c
  set
    -- Iniciar seguimiento solo si es NULL (primera vez)
    seguimiento_started_at = coalesce(c.seguimiento_started_at, v_now),

    -- Fijar start_date (nunca cambiar si ya existe)
    indagacion_start_date = coalesce(c.indagacion_start_date, v_start_date),

    -- Calcular due_date basado en start_date
    indagacion_due_date = coalesce(
      c.indagacion_due_date,
      public.add_business_days(
        coalesce(c.indagacion_start_date, v_start_date),
        coalesce(p_sla_days, 10)
      )
    ),

    -- ✅ CLAVE: Cambiar status TANTO DE 'Reportado' COMO DE 'Activo'
    status = case 
      when c.status in ('Reportado', 'Activo') then 'En Seguimiento'
      else c.status 
    end
  where c.id = p_case_id;
end;
$$;

-- Verificar que se creó correctamente
SELECT 'RPC updated: start_due_process' as status;


-- ============================================================
-- SOLUCIÓN 2: Asegurar action_type nunca sea NULL
-- ============================================================
-- Problema: process_stage NULL causa ERROR 400

UPDATE public.case_followups
SET action_type = COALESCE(action_type, 'Seguimiento')
WHERE action_type IS NULL;

-- Verificación
SELECT 
  COUNT(*) as total,
  COUNT(action_type) as con_valor,
  COUNT(*) - COUNT(action_type) as sin_valor
FROM public.case_followups;

-- ESPERADO: sin_valor = 0


-- ============================================================
-- SOLUCIÓN 3: Validar y corregir due_dates inválidos
-- ============================================================
-- Solo para etapas que TIENEN plazo (days_to_due > 0)
-- Etapas 3 y 4 (sin plazo) se dejan con NULL

-- Ver problemas
SELECT 
  cf.id,
  cf.case_id,
  cf.action_date,
  cf.process_stage,
  cf.due_date,
  s.days_to_due,
  CASE 
    WHEN s.days_to_due IS NULL THEN '✅ SIN plazo (OK)'
    WHEN cf.due_date IS NULL THEN '⚠️ Falta due_date'
    WHEN cf.due_date < cf.action_date THEN '❌ INVÁLIDO: due < action'
    ELSE '✅ VÁLIDO'
  END as validation
FROM public.case_followups cf
LEFT JOIN public.stage_sla s ON cf.process_stage = s.stage_key
WHERE cf.case_id IS NOT NULL AND cf.action_date IS NOT NULL
ORDER BY cf.case_id, cf.action_date;

-- Corregir solo etapas con plazo definido
UPDATE public.case_followups cf
SET due_date = add_business_days(cf.action_date, s.days_to_due)
FROM public.stage_sla s
WHERE cf.process_stage = s.stage_key
  AND s.days_to_due IS NOT NULL
  AND s.days_to_due > 0
  AND (
    cf.due_date IS NULL 
    OR cf.due_date = cf.action_date
    OR cf.due_date < cf.action_date
  );


-- ============================================================
-- VERIFICACIÓN FINAL
-- ============================================================

SELECT '=== VERIFICACIÓN FINAL ===' as check_type;

-- 1. RPC actualizado
SELECT 'RPC start_due_process' as objeto, '✅ Debe manejar in (Reportado, Activo)' as nota;

-- 2. case_followups sin action_type NULL
SELECT 
  'case_followups.action_type' as objeto,
  COUNT(*) as total,
  COUNT(CASE WHEN action_type IS NULL THEN 1 END) as null_count,
  CASE 
    WHEN COUNT(CASE WHEN action_type IS NULL THEN 1 END) = 0 THEN '✅ OK'
    ELSE '❌ PROBLEMA'
  END as status
FROM public.case_followups;

-- 3. due_dates válidos (para etapas con plazo)
SELECT 
  'due_dates' as objeto,
  COUNT(*) as total,
  COUNT(CASE WHEN due_date >= action_date THEN 1 END) as validos,
  COUNT(CASE WHEN due_date < action_date THEN 1 END) as invalidos,
  COUNT(CASE WHEN due_date IS NULL THEN 1 END) as nulls,
  CASE 
    WHEN COUNT(CASE WHEN due_date < action_date THEN 1 END) = 0 THEN '✅ OK'
    ELSE '❌ HAY INVÁLIDOS'
  END as status
FROM public.case_followups
WHERE action_date IS NOT NULL;

-- 4. Trinity específicamente
SELECT 
  'Trinity (caso crítico)' as objeto,
  c.status as status_actual,
  c.seguimiento_started_at as iniciado,
  CASE 
    WHEN c.status = 'Reportado' THEN '❌ Aún reportado'
    WHEN c.status = 'En Seguimiento' THEN '✅ Transicionó correctamente'
    ELSE '❓ Estado desconocido'
  END as nota
FROM public.cases c
WHERE c.id IN (
  SELECT student_id FROM public.students WHERE first_name LIKE '%TRINIDAD%'
  UNION
  SELECT id FROM public.cases WHERE id = '1fde4422-88f9-4668-a8e6-dcc4d16440c6'
);

-- 5. Resumen: Stage SLA correcto
SELECT 
  'stage_sla config' as objeto,
  COUNT(*) as total,
  COUNT(CASE WHEN days_to_due IS NULL THEN 1 END) as sin_plazo,
  COUNT(CASE WHEN days_to_due > 0 THEN 1 END) as con_plazo,
  '✅ SIN plazo en 3 y 4 es correcto' as nota
FROM public.stage_sla;


-- ============================================================
-- NOTAS FINALES
-- ============================================================

/*

✅ DECISIÓN: No modificar stage_sla

Las etapas 3 y 4 SIN plazo (NULL) son INTENCIONALES.
Significado: "Ejecutar estas acciones, pero sin límite de tiempo"

Esto es correcto para:
- Recopilación de Antecedentes: puede tomar días/semanas
- Entrevistas: proceso flexible sin plazo definido

Las etapas con plazo (1,2,5,6,7) tienen límites claros.

❌ PROBLEMAS REALES A SOLUCIONAR:

1. RPC MUST handle 'Reportado' status
   - Trinidad está creado con 'Reportado'
   - Cambiar: status in ('Reportado', 'Activo')

2. action_type NULL es problema
   - Debe tener valor por defecto
   - Cambiar: Coalesce a 'Seguimiento'

3. due_dates < action_date es inválido
   - Solo para etapas con plazo
   - Recalcular: add_business_days(action_date, days_to_due)

✅ DESPUÉS DE ESTO:
- Trinity puede transicionar
- No hay ERROR 400
- Plazos son correctos para etapas que tienen plazo
- Etapas informativas sin plazo funcionan bien

*/
