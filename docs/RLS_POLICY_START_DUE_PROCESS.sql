-- ============================================================
-- RLS POLICY: Permitir update en casos para iniciar debido proceso
-- ============================================================
-- Nota: Solo habilitar si RLS está activo y tienes errores de permisos
--
-- Esta policy permite a usuarios autenticados ejecutar el RPC
-- start_due_process que hace update en la tabla cases
--
-- ⚠️ IMPORTANTE: Si ya usas RLS más fino (por colegio/tenant),
-- adapta el using(...) con tu lógica de permisos existente
-- ============================================================

-- Habilitar RLS (solo si no está habilitado ya)
alter table public.cases enable row level security;

-- Policy para permitir update a usuarios autenticados
create policy "cases_start_due_process_authenticated"
on public.cases
for update
to authenticated
using (true)  -- ⚠️ Ajustar según tu lógica de tenant/permisos
with check (true);

-- Si usas multi-tenant por escuela, ejemplo:
-- using (school_id = auth.jwt() ->> 'school_id')
-- with check (school_id = auth.jwt() ->> 'school_id');
