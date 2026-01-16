-- ============================================================
-- SOLUCIÓN COMPLETA: Problemas reales de Supabase
-- Basado en análisis de datos exportados 2026-01-16
-- REPLANTEADO: Etapas 3 y 4 SIN plazo es INTENCIONAL
-- ============================================================

/*
PROBLEMAS ENCONTRADOS (CORREGIDO):

1. ✅ stage_sla.days_to_due: Stages 3 y 4 están VACÍOS (NULL)
   ├─ ESTO ES CORRECTO: Son etapas "informativas" sin plazo
   ├─ Significa: "Debes hacer esto, pero sin fecha límite"
   └─ NO ES UN PROBLEMA - Se mantiene como está

2. ❌ RPC start_due_process: Solo maneja 'Activo', NO 'Reportado'
   ├─ Trinidad creado con status='Reportado'
   ├─ RPC ignora porque verifica: WHERE status = 'Activo'
   └─ Trinidad nunca transiciona a 'En Seguimiento'

3. ❌ case_followups.process_stage: NULL en inserciones
   ├─ Frontend envía process_stage = null
   ├─ Supabase rechaza: NOT NULL constraint violation
   └─ ERROR 400 al registrar acciones

4. ⚠️  due_dates inconsistentes (PARCIAL):
   ├─ Algunos due_date = action_date (no calculado)
   ├─ Algunos due_date = NULL (correcto si no hay plazo)
   └─ Algunos due_date < action_date (inválido si hay plazo)
*/

-- ============================================================
-- NO TOCAR: stage_sla está correctamente configurado
-- ============================================================

-- Las etapas 3 y 4 SIN días_to_due es INTENCIONAL
-- Indica: "Hacer estas acciones, pero sin plazo específico"
-- Ejemplo real:
--   - Etapa 1: 1 día para comunicar
--   - Etapa 3: N días para recopilar (sin límite, informativo)
--   - Etapa 5: 10 días para investigar
--   - Etapa 6: 1 día para resolver

-- Verificar que está correcto
SELECT 
  stage_key,
  days_to_due,
  CASE 
    WHEN days_to_due IS NULL THEN '✅ SIN PLAZO (informativo)'
    WHEN days_to_due = 0 THEN '⚠️ CERO DÍAS (revisar)'
    ELSE '✅ CON PLAZO: ' || days_to_due || ' días'
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


-- ============================================================
-- SOLUCIÓN 1: Actualizar RPC para manejar 'Reportado'
-- ============================================================
-- ESTE ES EL PROBLEMA PRINCIPAL
-- RPC solo cambia status si es 'Activo', pero Trinity es 'Reportado'

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


-- ============================================================
-- SOLUCIÓN 3: Verificar que test de RPC funciona
-- ============================================================

-- Para probar el RPC sin afectar datos reales:
-- SELECT public.start_due_process('1fde4422-88f9-4668-a8e6-dcc4d16440c6', 10);

-- Luego verificar:
-- SELECT id, status, seguimiento_started_at, indagacion_start_date, indagacion_due_date
-- FROM public.cases
-- WHERE id = '1fde4422-88f9-4668-a8e6-dcc4d16440c6';


-- ============================================================
-- SOLUCIÓN 2: Asegurar process_stage nunca sea NULL
-- ============================================================
-- Frontend ya manda el valor, pero verificamos en DB

UPDATE public.case_followups
SET action_type = COALESCE(action_type, 'Seguimiento')
WHERE action_type IS NULL;

-- Verificación
SELECT COUNT(*) as sin_action_type
FROM public.case_followups
WHERE action_type IS NULL;


-- ============================================================
-- SOLUCIÓN 5: Recalcular due_dates de case_followups
-- ============================================================

-- Ver cuáles necesitan recálculo
SELECT 
  cf.id,
  cf.case_id,
  cf.action_date,
  cf.process_stage,
  cf.due_date,
  s.days_to_due,
  CASE 
    WHEN s.days_to_due IS NULL THEN '❌ Stage sin días'
    WHEN cf.due_date IS NULL THEN '⚠️ due_date NULL'
    WHEN cf.due_date < cf.action_date THEN '⚠️ due_date < action_date'
    ELSE '✅ OK'
  END as status
FROM public.case_followups cf
LEFT JOIN public.stage_sla s ON cf.process_stage = s.stage_key
WHERE cf.case_id IS NOT NULL
  AND cf.action_date IS NOT NULL
ORDER BY cf.case_id, cf.action_date;

-- Recalcular due_dates usando stage_sla actualizado
UPDATE public.case_followups cf
SET due_date = add_business_days(cf.action_date, s.days_to_due)
FROM public.stage_sla s
WHERE cf.process_stage = s.stage_key
  AND s.days_to_due IS NOT NULL
  AND s.days_to_due > 0
  AND (cf.due_date IS NULL OR cf.due_date = cf.action_date);


-- ============================================================
-- VERIFICACIÓN FINAL
-- ============================================================

SELECT 'Resumen de correcciones' as titulo;

-- 1. ¿stage_sla tiene todos los días?
SELECT 
  'stage_sla' as tabla,
  COUNT(*) as total,
  COUNT(days_to_due) as con_dias,
  COUNT(*) - COUNT(days_to_due) as sin_dias
FROM public.stage_sla;

-- 2. ¿RPC puede actualizar casos Reportado?
SELECT 
  'cases' as tabla,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'Reportado' THEN 1 END) as reportados,
  COUNT(CASE WHEN status = 'En Seguimiento' THEN 1 END) as en_seguimiento,
  COUNT(CASE WHEN status = 'Cerrado' THEN 1 END) as cerrados
FROM public.cases;

-- 3. ¿case_followups tiene action_type?
SELECT 
  'case_followups' as tabla,
  COUNT(*) as total,
  COUNT(action_type) as con_action_type,
  COUNT(*) - COUNT(action_type) as sin_action_type
FROM public.case_followups;

-- 4. ¿Hay due_dates correctos?
SELECT 
  'due_dates' as check_name,
  COUNT(*) as total,
  COUNT(due_date) as con_due_date,
  COUNT(CASE WHEN due_date >= action_date THEN 1 END) as validos,
  COUNT(CASE WHEN due_date < action_date THEN 1 END) as invalidos
FROM public.case_followups
WHERE action_date IS NOT NULL;


-- ============================================================
-- NOTAS DE EJECUCIÓN
-- ============================================================

/*
PASOS PARA EJECUTAR:

1. Ir a Supabase Dashboard → SQL Editor
2. Ejecutar TODO este script en un solo bloque (o por secciones)
3. Revisar las verificaciones finales
4. Si todo muestra "✅ OK", está listo
5. Si hay "❌" o "⚠️", hay problemas pendientes

DESPUÉS DE EJECUTAR:
- Trinidad podrá transicionar a "En Seguimiento"
- Los due_dates se calcularán correctamente
- El frontend mostrará plazos sin errores

ORDEN DE VALIDACIÓN:
1. stage_sla: Todos deben tener days_to_due > 0
2. RPC: Debe manejar tanto 'Reportado' como 'Activo'
3. case_followups: Todos deben tener action_type
4. due_dates: Deben ser >= action_date

*/
