-- 002_add_business_days_and_v_control_plazos.sql
-- Simplified for calendar days (no holidays)

-- Remove legacy add_business_days function if present
DROP FUNCTION IF EXISTS public.add_business_days(date, integer);

-- Create or replace view v_control_plazos that uses calendar days
CREATE OR REPLACE VIEW public.v_control_plazos AS
SELECT
  f.id AS followup_id,
  f.case_id,
  f.action_type AS tipo_accion,
  (f.action_date::date) AS fecha,
  COALESCE(f.description, f.detail) AS descripcion,
  f.detail,
  f.responsible AS responsable,
  f.stage_status AS estado_etapa,
  f.process_stage AS etapa_debido_proceso,
  (TRIM(CONCAT(s.first_name,' ',s.last_name))) AS estudiante,
  c.status AS estado_caso,
  c.conduct_type AS tipificacion_conducta,
  c.course_incident AS curso_incidente,
  c.incident_date AS fecha_incidente,
  c.legacy_case_number AS legacy_case_number,
  f.due_date AS fecha_plazo,
  -- dias_restantes: calendar days between due_date and today
  CASE WHEN f.due_date IS NULL THEN NULL ELSE (f.due_date::date - current_date) END AS dias_restantes,
  NULL::text AS alerta_urgencia
FROM public.case_followups f
LEFT JOIN public.cases c ON c.id = f.case_id
LEFT JOIN public.students s ON s.id = c.student_id;
