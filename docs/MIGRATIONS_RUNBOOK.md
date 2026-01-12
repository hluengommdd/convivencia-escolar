# Migration Runbook — Holidays / SLA / Trigger


This runbook describes safe steps to apply the migration and seed scripts added in `schema/` to a staging or production database.

Files
- `schema/004_add_holidays_and_compute_due_date.sql` — provides `compute_due_date(start_date, days, consider_holidays)` (now ignores holidays) and trigger `trg_case_followups_set_due_date` that ensures `due_date` is set.
- `schema/005_seed_stage_sla_and_holidays.sql` — seeds `stage_sla` values (no holidays seeding).
- `run_migrations.sh` — helper script that runs `004` then `005` using `DATABASE_URL`.

Prerequisites
- Have a recent DB backup / snapshot. For Supabase, take a project database backup or export.
- Use a DB role with CREATE FUNCTION and CREATE TRIGGER privileges (admin/service role).
- Run first on staging, then on production during a maintenance window if needed.

Staging (recommended)
1. Set `DATABASE_URL` in your shell (example):

```bash
export DATABASE_URL="postgres://<USER>:<PASS>@<HOST>:5432/<DBNAME>"
```


2. Run the migration file `004` only (creates compute function and trigger):

```bash
psql "$DATABASE_URL" -f schema/004_add_holidays_and_compute_due_date.sql
```

3. Seed `stage_sla` (no holidays):

```bash
psql "$DATABASE_URL" -f schema/005_seed_stage_sla_and_holidays.sql
```


5. Verification queries (staging):

```sql
SELECT public.compute_due_date(current_date, 3, true) AS due_test;
WITH one_case AS (SELECT id FROM public.cases LIMIT 1)
INSERT INTO public.case_followups (case_id, process_stage, action_date)
SELECT id, '1. Comunicación/Denuncia', current_date FROM one_case
RETURNING id, case_id, process_stage, action_date, due_date;
```

6. Validate app behavior: create a followup via the UI and ensure `Fecha_Plazo` is set when omitted.

Production (only after staging validation)
1. Schedule a maintenance window or apply during low usage.
2. Take a DB backup / snapshot.
3. Run the same commands as in staging (`004`, `005`, `006`) using the production `DATABASE_URL`.

Rollback / Removal

-- To remove the trigger/function (if needed):

```sql
DROP TRIGGER IF EXISTS trg_case_followups_set_due_date ON public.case_followups;
DROP FUNCTION IF EXISTS public.case_followups_set_due_date();
DROP FUNCTION IF EXISTS public.compute_due_date(DATE, INTEGER, BOOLEAN);
```

Notes & Safety
- The trigger only sets `due_date` when `NEW.due_date IS NULL`. It will not overwrite values provided by the app.
- `schema/006` creates `uq_holidays_holiday_date` unique index to avoid duplicates by date; if you need to store multiple reasons per date, modify the schema before running.
- Test carefully any edge-case process stages strings: `stage_sla.stage_key` must match `process_stage` values used by the application.

Contact
- If anything fails during the migration, revert the change and contact the DB admin.
