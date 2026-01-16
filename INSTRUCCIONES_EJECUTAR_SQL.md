# Instrucciones para actualizar la RPC en Supabase

## Problema
El RPC `start_due_process` necesita ser actualizado para manejar casos con estado "Reportado", no solo "Activo".

## Solución
Ejecuta el siguiente SQL en Supabase:

### Paso 1: Ir a Supabase
1. Abre https://supabase.com
2. Ve a tu proyecto
3. Abre el editor SQL (SQL Editor en el menú lateral)

### Paso 2: Copiar y ejecutar el siguiente SQL

```sql
-- ============================================================
-- RPC: start_due_process (ACTUALIZADO)
-- ============================================================
-- Proposito: Iniciar el debido proceso en un caso
-- - Setea seguimiento_started_at (solo si no existe) con now()
-- - Setea indagacion_start_date (hoy en UTC)
-- - Setea indagacion_due_date (start_date + SLA business days)
-- - Cambia status a "En Seguimiento" (si era "Reportado" o "Activo")
-- - Usa add_business_days para calcular fechas hábiles

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
    status = case when c.status in ('Reportado', 'Activo') then 'En Seguimiento' else c.status end
  where c.id = p_case_id;
end;
$$;
```

### Paso 3: Ejecutar
- Click en el botón "Run" (o Ctrl+Enter)
- Deberías ver "Success" si todo está bien

## Después de ejecutar

La RPC ahora manejará correctamente:
- ✅ Casos en estado "Reportado" → cambiarán a "En Seguimiento"
- ✅ Casos en estado "Activo" → cambiarán a "En Seguimiento"
- ✅ Otros estados → se mantienen igual

Ahora podrás hacer click en "Iniciar debido proceso" en cualquier caso y funcionará correctamente.
