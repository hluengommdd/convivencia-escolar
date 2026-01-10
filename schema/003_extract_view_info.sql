-- Extraction helper: collect view definition, table schemas, constraints and samples
-- Run this in psql or the Supabase SQL editor and paste the full output here.

-- 1) View definition
SELECT '--- VIEW DEFINITION: v_control_plazos ---' AS info;
SELECT pg_get_viewdef('public.v_control_plazos', true) AS view_definition;

-- 2) Does a holidays table exist?
SELECT '--- HOLIDAYS TABLE EXISTS? ---' AS info;
SELECT to_regclass('public.holidays') IS NOT NULL AS holidays_exists;

-- 3) Table columns (public.case_followups, public.cases, public.students, public.holidays)
SELECT '--- COLUMNS: case_followups ---' AS info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'case_followups'
ORDER BY ordinal_position;

SELECT '--- COLUMNS: cases ---' AS info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'cases'
ORDER BY ordinal_position;

SELECT '--- COLUMNS: students ---' AS info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'students'
ORDER BY ordinal_position;

SELECT '--- COLUMNS: holidays (if exists) ---' AS info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'holidays'
ORDER BY ordinal_position;

-- 4) Constraints for the tables (primary keys, foreign keys, unique, check)
SELECT '--- CONSTRAINTS: case_followups ---' AS info;
SELECT conname, pg_get_constraintdef(oid) AS def
FROM pg_constraint
WHERE conrelid = 'public.case_followups'::regclass;

SELECT '--- CONSTRAINTS: cases ---' AS info;
SELECT conname, pg_get_constraintdef(oid) AS def
FROM pg_constraint
WHERE conrelid = 'public.cases'::regclass;

SELECT '--- CONSTRAINTS: students ---' AS info;
SELECT conname, pg_get_constraintdef(oid) AS def
FROM pg_constraint
WHERE conrelid = 'public.students'::regclass;

SELECT '--- CONSTRAINTS: holidays (if exists) ---' AS info;
-- The holidays table may not exist in all environments. We only report existence above
-- If it exists and you want constraints, run the following manually in your DB:
--   SELECT conname, pg_get_constraintdef(oid) AS def
--   FROM pg_constraint
--   WHERE conrelid = (SELECT oid FROM pg_class WHERE relname='holidays' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname='public'));

-- 5) Indexes (helpful to understand important lookup columns)
SELECT '--- INDEXES: case_followups ---' AS info;
SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'case_followups';

SELECT '--- INDEXES: cases ---' AS info;
SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'cases';

SELECT '--- INDEXES: students ---' AS info;
SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'students';

SELECT '--- INDEXES: holidays (if exists) ---' AS info;
-- Indexes for holidays skipped (table may not exist). If needed, run:
--   SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'holidays';

-- 6) Sample rows to see real data patterns
SELECT '--- SAMPLE: case_followups (due_date IS NOT NULL, latest 10) ---' AS info;
SELECT * FROM public.case_followups WHERE due_date IS NOT NULL ORDER BY created_at DESC LIMIT 10;

SELECT '--- SAMPLE: case_followups (due_date IS NULL, latest 10) ---' AS info;
SELECT * FROM public.case_followups WHERE due_date IS NULL ORDER BY created_at DESC LIMIT 10;

SELECT '--- SAMPLE: cases (latest 10) ---' AS info;
SELECT * FROM public.cases ORDER BY created_at DESC LIMIT 10;

SELECT '--- SAMPLE: students (latest 10) ---' AS info;
SELECT * FROM public.students ORDER BY created_at DESC LIMIT 10;

SELECT '--- SAMPLE: holidays (all) ---' AS info;
-- Sample rows for holidays skipped because the table may not exist. If it exists run:
--   SELECT * FROM public.holidays ORDER BY holiday_date ASC LIMIT 200;

-- 7) Row counts (to know table sizes)
SELECT '--- ROW COUNTS ---' AS info;
SELECT 'case_followups' AS table_name, count(*) FROM public.case_followups
UNION ALL
SELECT 'cases', count(*) FROM public.cases
UNION ALL
SELECT 'students', count(*) FROM public.students;

-- If you have a holidays table, check its row count separately. We reported existence earlier.

-- End of extraction script
