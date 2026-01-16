-- ============================================================
-- ACTUALIZAR RPC: start_due_process
-- ============================================================
-- PROBLEMA: El RPC actual no maneja el status 'Reportado'
-- Solo funciona para casos con status 'Activo'
-- Trinidad fue creado con status 'Reportado' y por eso falla
--
-- SOLUCIÓN: Agregar 'Reportado' a la condición
-- ============================================================

CREATE OR REPLACE FUNCTION public.start_due_process(
  p_case_id uuid,
  p_sla_days integer DEFAULT 10
)
RETURNS void
LANGUAGE plpgsql
AS $$
declare
  v_now timestamptz := now();
  v_start_date date := (v_now at time zone 'UTC')::date;
begin
  update public.cases c
  set
    -- inicio explícito (primera vez)
    seguimiento_started_at = coalesce(c.seguimiento_started_at, v_now),

    -- el reloj del SLA parte aquí: se recalcula start/due desde hoy
    indagacion_start_date = coalesce(c.indagacion_start_date, v_start_date),
    indagacion_due_date = coalesce(
      c.indagacion_due_date,
      public.add_business_days(v_start_date, coalesce(p_sla_days, 10))
    ),

    -- estado: AHORA MANEJA 'Reportado' Y 'Activo'
    status = case 
      when c.status in ('Reportado', 'Activo') then 'En Seguimiento'
      else c.status 
    end
  where c.id = p_case_id;
end;
$$;
