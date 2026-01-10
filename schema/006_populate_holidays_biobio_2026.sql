-- Populate public.holidays with Chile (Biobío) 2026 legal holidays and school breaks
-- Inserts one row per date. Safe to re-run thanks to unique index and ON CONFLICT DO NOTHING.

BEGIN;

-- Ensure a uniqueness constraint on holiday_date to avoid duplicates
CREATE UNIQUE INDEX IF NOT EXISTS uq_holidays_holiday_date ON public.holidays (holiday_date);

-- 1) Legal holidays (fixed date => recurring true; movable => recurring false)
INSERT INTO public.holidays (holiday_date, description, recurring)
VALUES
  ('2026-01-01', 'Año Nuevo', true),
  ('2026-04-03', 'Viernes Santo', false),
  ('2026-04-04', 'Sábado Santo', false),
  ('2026-05-01', 'Día del Trabajo', true),
  ('2026-05-21', 'Día de las Glorias Navales', true),
  ('2026-06-29', 'San Pedro y San Pablo', true),
  ('2026-07-16', 'Virgen del Carmen', true),
  ('2026-08-15', 'Asunción de la Virgen', true),
  ('2026-09-18', 'Independencia Nacional', true),
  ('2026-09-19', 'Glorias del Ejército', true),
  ('2026-10-12', 'Encuentro de Dos Mundos', true),
  ('2026-10-31', 'Día Nacional de las Iglesias Evangélicas y Protestantes', true),
  ('2026-11-01', 'Día de Todos los Santos', true),
  ('2026-12-08', 'Inmaculada Concepción', true),
  ('2026-12-25', 'Navidad', true)
ON CONFLICT (holiday_date) DO NOTHING;

-- 2) School break: Vacaciones de Invierno (Biobío) - Régimen Semestral
-- Range: 2026-06-22 .. 2026-07-03 (inclusive)
INSERT INTO public.holidays (holiday_date, description, recurring)
VALUES
  ('2026-06-22', 'Vacaciones de Invierno (Biobío) - Régimen Semestral', false),
  ('2026-06-23', 'Vacaciones de Invierno (Biobío) - Régimen Semestral', false),
  ('2026-06-24', 'Vacaciones de Invierno (Biobío) - Régimen Semestral', false),
  ('2026-06-25', 'Vacaciones de Invierno (Biobío) - Régimen Semestral', false),
  ('2026-06-26', 'Vacaciones de Invierno (Biobío) - Régimen Semestral', false),
  ('2026-06-27', 'Vacaciones de Invierno (Biobío) - Régimen Semestral', false),
  ('2026-06-28', 'Vacaciones de Invierno (Biobío) - Régimen Semestral', false),
  ('2026-06-29', 'Vacaciones de Invierno (Biobío) - Régimen Semestral', false),
  ('2026-06-30', 'Vacaciones de Invierno (Biobío) - Régimen Semestral', false),
  ('2026-07-01', 'Vacaciones de Invierno (Biobío) - Régimen Semestral', false),
  ('2026-07-02', 'Vacaciones de Invierno (Biobío) - Régimen Semestral', false),
  ('2026-07-03', 'Vacaciones de Invierno (Biobío) - Régimen Semestral', false)
ON CONFLICT (holiday_date) DO NOTHING;

-- 3) School break: Receso (Biobío) - Régimen Trimestral
-- Range: 2026-09-14 .. 2026-09-18 (inclusive)
INSERT INTO public.holidays (holiday_date, description, recurring)
VALUES
  ('2026-09-14', 'Receso (Biobío) - Régimen Trimestral', false),
  ('2026-09-15', 'Receso (Biobío) - Régimen Trimestral', false),
  ('2026-09-16', 'Receso (Biobío) - Régimen Trimestral', false),
  ('2026-09-17', 'Receso (Biobío) - Régimen Trimestral', false),
  ('2026-09-18', 'Receso (Biobío) - Régimen Trimestral', false)
ON CONFLICT (holiday_date) DO NOTHING;

COMMIT;

-- Notes:
-- - This script inserts fixed legal holidays (some marked recurring) and expands school breaks into individual dates.
-- - It creates a unique index on `holiday_date` to prevent duplicate rows by date; adjust if you need to store multiple reasons per date.
