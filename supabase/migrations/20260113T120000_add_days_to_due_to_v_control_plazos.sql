-- Adds days_to_due to v_control_plazos by joining stage_sla
-- Keeps existing output intact and only appends:
--   - etapa_numero (derived from etapa_debido_proceso)
--   - days_to_due (from stage_sla)

create or replace view public.v_control_plazos as
with base as (
  -- -----------------------------------------------------------------------
  -- 1) PEGAR AQUÍ la definición ACTUAL de la vista (solo el SELECT ...).
  --    La obtienes desde: /tmp/v_control_plazos_viewdef.sql
  --
  --    IMPORTANTE:
  --    - Pega el SELECT completo tal como viene.
  --    - No pongas "create view..." aquí, solo el SELECT.
  -- -----------------------------------------------------------------------

  -- >>>>> INICIO PEGADO VIEWDEF ACTUAL
  /* REEMPLAZA ESTE BLOQUE por el contenido de /tmp/v_control_plazos_viewdef.sql */
  select 1 as _placeholder_;
  -- <<<<< FIN PEGADO VIEWDEF ACTUAL
),
enriched as (
  select
    b.*,

    -- 2) Extrae el número de etapa desde strings tipo "Etapa 2", "2. Notificación", etc.
    nullif(substring(coalesce(b.etapa_debido_proceso, '') from '(\d+)'), '')::int as etapa_numero

  from base b
)
select
  e.*,

  -- 3) Trae days_to_due desde stage_sla (NULL para 3 y 4 si stage_sla lo indica)
  s.days_to_due

from enriched e
left join public.stage_sla s
  on s.stage_number = e.etapa_numero;

-- Permisos: permitir lectura desde el frontend
grant select on public.v_control_plazos to anon, authenticated;
