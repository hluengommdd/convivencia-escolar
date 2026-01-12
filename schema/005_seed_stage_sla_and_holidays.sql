-- 005_seed_stage_sla_and_holidays.sql
-- Seed stage_sla only (no holidays). This script is idempotent.

CREATE TABLE IF NOT EXISTS public.stage_sla (
  id SERIAL PRIMARY KEY,
  stage_key TEXT UNIQUE NOT NULL,
  sla_days INT NOT NULL DEFAULT 0
);

-- Example SLA values (adjust as needed)
INSERT INTO public.stage_sla (stage_key, sla_days) VALUES
  ('1. Comunicación/Denuncia', 3)
ON CONFLICT (stage_key) DO UPDATE SET sla_days = EXCLUDED.sla_days;

INSERT INTO public.stage_sla (stage_key, sla_days) VALUES
  ('2. Investigación inicial', 7)
ON CONFLICT (stage_key) DO UPDATE SET sla_days = EXCLUDED.sla_days;

INSERT INTO public.stage_sla (stage_key, sla_days) VALUES
  ('3. Entrevistas y medidas', 5)
ON CONFLICT (stage_key) DO UPDATE SET sla_days = EXCLUDED.sla_days;
