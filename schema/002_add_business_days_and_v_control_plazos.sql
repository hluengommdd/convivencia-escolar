-- Migration: add_business_days() and versioned view v_control_plazos
-- Created: 2026-01-10
-- Notes:
-- 1) This file proposes a safe, idempotent function `add_business_days` that skips
--    Saturdays, Sundays and (optionally) rows from a `holidays(holiday_date date)` table.
-- 2) A template `CREATE OR REPLACE VIEW v_control_plazos` is included. Because the
--    authoritative view definition lives in the production DB, you MUST extract the
--    real view SQL from the DB and merge any missing business rules before applying.

BEGIN;

-- 1) Function: add_business_days(start_date date, days int)
--    Adds (or subtracts, when days < 0) business days to a date.
--    Behavior: treats Saturday and Sunday as non-business days. If a table
--    `public.holidays(holiday_date date)` exists, those dates are also skipped.
CREATE OR REPLACE FUNCTION public.add_business_days(start_date date, days int)
RETURNS date AS $$
DECLARE
  d date := start_date;
  step int := CASE WHEN days >= 0 THEN 1 ELSE -1 END;
  remaining int := abs(days);
BEGIN
  IF remaining = 0 THEN
    RETURN d;
  END IF;

  WHILE remaining > 0 LOOP
    d := d + step;
    IF EXTRACT(DOW FROM d) NOT IN (0,6) -- Sunday=0, Saturday=6
       AND (
         to_regclass('public.holidays') IS NULL -- no holidays table -> ignore holidays
         OR NOT EXISTS (SELECT 1 FROM public.holidays h WHERE h.holiday_date = d)
       ) THEN
      remaining := remaining - 1;
    END IF;
  END LOOP;

  RETURN d;
END;
$$ LANGUAGE plpgsql STABLE;

-- 2) Template view: v_control_plazos
-- NOTE: This is a best-effort template based on frontend usage in `src/api/db.js`.
-- You should extract the real view definition from the database (see instructions below),
-- compare it with this template, and adapt any institution-specific logic (e.g. how
-- `fecha_plazo` is computed from different followup fields).

CREATE OR REPLACE VIEW public.v_control_plazos AS
SELECT
  cf.id AS followup_id,
  c.id AS case_id,
  cf.action_type AS tipo_accion,
  cf.action_date::date AS fecha,
  COALESCE(cf.description, cf.detail) AS descripcion,
  cf.detail AS detalle,
  cf.responsible AS responsable,
  cf.stage_status AS estado_etapa,
  cf.process_stage AS etapa_debido_proceso,
  (s.first_name || ' ' || s.last_name) AS estudiante,
  c.status AS estado_caso,
  c.conduct_type AS tipificacion_conducta,
  c.course_incident AS curso_incidente,
  c.incident_date AS fecha_incidente,
  COALESCE(c.legacy_case_number, c.case_number) AS legacy_case_number,

  -- Use any explicit due_date on the followup; if none, keep NULL. In some
  -- deployments there may be a 'deadline_days' integer to compute due date via
  -- `add_business_days(cf.action_date::date, cf.deadline_days)`. Adapt if needed.
  cf.due_date::date AS fecha_plazo,

  -- dias_restantes: business days from current_date to fecha_plazo (approximate).
  -- Implementation: count business days in the calendar range [current_date, fecha_plazo].
  CASE WHEN cf.due_date IS NULL THEN NULL
    WHEN cf.due_date::date < current_date THEN
      -- negative remaining (already past due)
      -(
        (SELECT COUNT(*) FROM generate_series(cf.due_date::date + 1, current_date, '1 day') g
         WHERE EXTRACT(DOW FROM g) NOT IN (0,6)
           AND (to_regclass('public.holidays') IS NULL OR NOT EXISTS (SELECT 1 FROM public.holidays h WHERE h.holiday_date = g)))
      )
    ELSE
      (SELECT COUNT(*) FROM generate_series(current_date, cf.due_date::date, '1 day') g
         WHERE EXTRACT(DOW FROM g) NOT IN (0,6)
           AND (to_regclass('public.holidays') IS NULL OR NOT EXISTS (SELECT 1 FROM public.holidays h WHERE h.holiday_date = g))) - 1
  END AS dias_restantes

FROM public.case_followups cf
LEFT JOIN public.cases c ON c.id = cf.case_id
LEFT JOIN public.students s ON s.id = c.student_id;

COMMIT;

-- ------------------
-- Usage / extraction notes
-- ------------------
-- To extract the existing view definition from a Postgres DB (replace connection info):
--   pg_dump --schema-only --table=public.v_control_plazos -h <host> -U <user> -d <db> > v_control_plazos.sql
-- or from psql:
--   psql -h <host> -U <user> -d <db> -c "\d+ public.v_control_plazos"

-- To apply this migration (using psql):
--   psql -h <host> -U <user> -d <db> -f 002_add_business_days_and_v_control_plazos.sql

-- Important: test in a staging environment first. If your production view contains
-- extra business rules (e.g. different fields, joins, or filtering by case status),
-- merge those into the CREATE OR REPLACE VIEW statement above before applying.
