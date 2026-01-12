-- 004_add_holidays_and_compute_due_date.sql
-- Compute due_date using calendar days (ignore holidays)

-- Drop old objects if they exist
DROP TRIGGER IF EXISTS trg_case_followups_set_due_date ON public.case_followups;
DROP FUNCTION IF EXISTS public.case_followups_set_due_date();
DROP FUNCTION IF EXISTS public.compute_due_date(DATE, INTEGER, BOOLEAN);

-- compute_due_date: signature kept but consider_holidays is ignored
CREATE OR REPLACE FUNCTION public.compute_due_date(start_date DATE, days INT, consider_holidays BOOLEAN DEFAULT true)
RETURNS DATE LANGUAGE plpgsql AS $$
BEGIN
  IF start_date IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN (start_date::date + (days)::int);
END;
$$;

-- Trigger function: ensure due_date is never left NULL.
-- If no matching SLA, use sla_days = 0 and set due_date = base_date
CREATE OR REPLACE FUNCTION public.case_followups_set_due_date()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  sla_days INT := 0;
  base_date DATE;
BEGIN
  -- Only set when due_date not provided
  IF NEW.due_date IS NOT NULL THEN
    RETURN NEW;
  END IF;

  base_date := COALESCE(NEW.action_date::date, current_date);

  -- Try to find SLA days from stage_sla table (if present)
  BEGIN
    SELECT s.sla_days INTO sla_days FROM public.stage_sla s WHERE s.stage_key = NEW.process_stage LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    sla_days := 0;
  END;

  IF sla_days IS NULL THEN sla_days := 0; END IF;

  NEW.due_date := public.compute_due_date(base_date, sla_days, true);

  RETURN NEW;
END;
$$;

-- Create trigger on case_followups to run before insert or update
DROP TRIGGER IF EXISTS trg_case_followups_set_due_date ON public.case_followups;
CREATE TRIGGER trg_case_followups_set_due_date
BEFORE INSERT OR UPDATE ON public.case_followups
FOR EACH ROW
EXECUTE FUNCTION public.case_followups_set_due_date();
