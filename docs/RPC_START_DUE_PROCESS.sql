-- ============================================================
-- RPC: start_due_process
-- ============================================================
-- Proposito: Iniciar el debido proceso en un caso
-- - Setea seguimiento_started_at (solo si no existe) con now()
-- - Setea indagacion_start_date (hoy en UTC)
-- - Setea indagacion_due_date (start_date + SLA business days)
-- - Cambia status a "En Seguimiento" (si era "Activo")
-- - Usa add_business_days para calcular fechas hábiles
--
-- Uso en Frontend:
--   const { error } = await supabase.rpc('start_due_process', {
--     p_case_id: caseId,
--     p_sla_days: 10
--   })
--
-- ============================================================

create or replace function public.start_due_process(
  p_case_id uuid,
  p_sla_days integer default 10
)
returns void
language plpgsql
as $$
declare
  v_now timestamptz := now();
  v_today date := (v_now at time zone 'UTC')::date;
begin
  update public.cases c
  set
    seguimiento_started_at = coalesce(c.seguimiento_started_at, v_now),
    indagacion_start_date = coalesce(c.indagacion_start_date, v_today),
    indagacion_due_date = coalesce(
      c.indagacion_due_date,
      public.add_business_days(
        coalesce(c.indagacion_start_date, v_today),
        p_sla_days
      )
    ),
    status = case when c.status = 'Activo' then 'En Seguimiento' else c.status end
  where c.id = p_case_id;
end;
$$;
