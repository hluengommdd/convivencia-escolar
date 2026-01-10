-- Migration: 004_add_holidays_and_compute_due_date.sql
-- Creates `holidays` table, `compute_due_date` function, and a trigger
-- that fills `due_date` on `case_followups` using `stage_sla.days_to_due`.

BEGIN;

-- 1) Holidays table (optional recurring holidays support)
CREATE TABLE IF NOT EXISTS public.holidays (
  id BIGSERIAL PRIMARY KEY,
  holiday_date DATE NOT NULL,
  description TEXT,
  recurring BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_holidays_holiday_date ON public.holidays (holiday_date);

-- 2) compute_due_date(start_date, days, consider_holidays)
-- Counts only business days (Mon-Fri) and skips holidays in `public.holidays`.
-- The function treats the first business day >= start_date as day 1.
CREATE OR REPLACE FUNCTION public.compute_due_date(start_date DATE, days INTEGER, consider_holidays BOOLEAN DEFAULT true)
RETURNS DATE
LANGUAGE plpgsql
AS $func$
DECLARE
  current_date_iter DATE := start_date;
  counted INTEGER := 0;
BEGIN
  IF start_date IS NULL THEN
    RAISE EXCEPTION 'start_date cannot be null';
  END IF;

  IF days IS NULL OR days <= 0 THEN
    -- If days is 0 or negative, return start_date (no movement)
    RETURN start_date;
  END IF;

  -- Move to the first business day >= start_date
  LOOP
    IF EXTRACT(DOW FROM current_date_iter) IN (0,6) THEN
      current_date_iter := current_date_iter + 1;
      CONTINUE;
    END IF;

    IF consider_holidays THEN
      IF EXISTS (SELECT 1 FROM public.holidays h WHERE h.holiday_date = current_date_iter OR (h.recurring AND to_char(h.holiday_date, 'MM-DD') = to_char(current_date_iter, 'MM-DD'))) THEN
        current_date_iter := current_date_iter + 1;
        CONTINUE;
      END IF;
    END IF;

    EXIT; -- current_date_iter is the first business day
  END LOOP;

  -- current_date_iter is day 1
  counted := 1;
  IF days = 1 THEN
    RETURN current_date_iter;
  END IF;

  WHILE counted < days LOOP
    current_date_iter := current_date_iter + 1;

    IF EXTRACT(DOW FROM current_date_iter) IN (0,6) THEN
      CONTINUE;
    END IF;

    IF consider_holidays THEN
      IF EXISTS (SELECT 1 FROM public.holidays h WHERE h.holiday_date = current_date_iter OR (h.recurring AND to_char(h.holiday_date, 'MM-DD') = to_char(current_date_iter, 'MM-DD'))) THEN
        CONTINUE;
      END IF;
    END IF;

    counted := counted + 1;
  END LOOP;

  RETURN current_date_iter;
END;
$func$;

-- 3) Trigger function to set due_date on case_followups when NULL
CREATE OR REPLACE FUNCTION public.case_followups_set_due_date()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $trg$
DECLARE
  sla_days INTEGER;
  base_date DATE;
BEGIN
  -- If a due_date was explicitly provided, do nothing
  IF NEW.due_date IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Determine base date: prefer action_date, else today
  base_date := COALESCE(NEW.action_date, CURRENT_DATE);

  -- Lookup days_to_due from stage_sla using process_stage
  SELECT days_to_due INTO sla_days FROM public.stage_sla WHERE stage_key = NEW.process_stage LIMIT 1;

  IF sla_days IS NULL THEN
    RETURN NEW; -- no SLA defined for this stage
  END IF;

  NEW.due_date := public.compute_due_date(base_date, sla_days, true);
  RETURN NEW;
END;
$trg$;

-- 4) Create trigger (replace if exists)
DROP TRIGGER IF EXISTS trg_case_followups_set_due_date ON public.case_followups;
CREATE TRIGGER trg_case_followups_set_due_date
BEFORE INSERT OR UPDATE ON public.case_followups
FOR EACH ROW
WHEN (NEW.due_date IS NULL)
EXECUTE FUNCTION public.case_followups_set_due_date();

COMMIT;

-- Usage examples / notes:
-- 1) To compute a due date manually:
--    SELECT public.compute_due_date('2026-01-10'::date, 3, true);
-- 2) To add a holiday (one-off):
--    INSERT INTO public.holidays (holiday_date, description, recurring) VALUES ('2026-12-25', 'Navidad', false);
-- 3) To add a recurring holiday (same month-day each year):
--    INSERT INTO public.holidays (holiday_date, description, recurring) VALUES ('2000-05-01', 'Día del Trabajo', true);
