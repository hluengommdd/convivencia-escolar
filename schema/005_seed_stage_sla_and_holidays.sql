-- Seed data and tests: stage_sla and holidays
-- Usage: run this after applying migration `004_add_holidays_and_compute_due_date.sql`.

BEGIN;

-- 1) Upsert example SLAs for known stages
-- Normalize `stage_key` values to match frontend `process_stage` exactly
INSERT INTO public.stage_sla (stage_key, days_to_due)
VALUES
  ('1. Comunicación/Denuncia', 3),
  ('2. Notificación Apoderados', 5),
  ('3. Recopilación Antecedentes', 7),
  ('4. Entrevistas', 5),
  ('5. Investigación/Análisis', 10),
  ('6. Resolución y Sanciones', 3),
  ('7. Apelación/Recursos', 7),
  ('8. Seguimiento', 14)
ON CONFLICT (stage_key) DO UPDATE SET days_to_due = EXCLUDED.days_to_due;

-- 2) Insert sample holidays (one-off and recurring)
INSERT INTO public.holidays (holiday_date, description, recurring)
VALUES
  ('2026-01-01', 'Año Nuevo', true),
  ('2026-05-01', 'Día del Trabajo', true),
  ('2026-12-25', 'Navidad', false)
ON CONFLICT DO NOTHING;

COMMIT;

-- === Quick tests ===
-- 1) Compute due_date examples
-- SELECT public.compute_due_date('2026-01-09'::date, 3, true) AS due_3_from_2026_01_09;
-- SELECT public.compute_due_date('2026-12-24'::date, 2, true) AS due_2_from_2026_12_24; -- tests skipping 25th

-- 2) Verify trigger on case_followups (replace <CASE_ID> and <STAGE_KEY> accordingly)
-- -- Example: use an existing case id from your DB
-- WITH one_case AS (SELECT id FROM public.cases LIMIT 1)
-- INSERT INTO public.case_followups (case_id, process_stage, action_date)
-- SELECT id, '1. Comunicación/Denuncia', current_date FROM one_case
-- RETURNING id, case_id, process_stage, action_date, due_date;

-- 3) Inspect populated stage_sla and holidays
-- SELECT * FROM public.stage_sla ORDER BY stage_key;
-- SELECT * FROM public.holidays ORDER BY holiday_date;
