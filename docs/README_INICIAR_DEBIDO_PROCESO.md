# 🚀 Implementación: Iniciar Debido Proceso

## ✅ Resumen de cambios

Esta implementación permite iniciar formalmente el debido proceso en un caso, seteando fechas de inicio y vencimiento con SLA de 10 días hábiles.

---

## 📋 Archivos modificados

### 1. **Backend (Supabase)**
- `docs/RPC_START_DUE_PROCESS.sql` - RPC para iniciar debido proceso
- `docs/RLS_POLICY_START_DUE_PROCESS.sql` - Policy de permisos (opcional)

### 2. **Frontend (VS Code)**
- `src/api/db.js` - Función `iniciarDebidoProceso(caseId, slaDays)`
- `src/components/CaseDetailPanel.jsx` - Botón "🚀 Iniciar debido proceso"

---

## 🔧 Pasos para activar

### 1️⃣ Crear RPC en Supabase

Copia y ejecuta en **Supabase SQL Editor**:

```sql
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
                                                                    ```

                                                                    ### 2️⃣ (Opcional) Crear policy de permisos

                                                                    Solo si tienes RLS habilitado y recibes errores de permisos:

                                                                    ```sql
                                                                    alter table public.cases enable row level security;

                                                                    create policy "cases_start_due_process_authenticated"
                                                                    on public.cases
                                                                    for update
                                                                    to authenticated
                                                                    using (true)
                                                                    with check (true);
                                                                    ```

                                                                    ⚠️ **Nota:** Si usas multi-tenant, ajusta `using(...)` según tu lógica de permisos.

                                                                    ### 3️⃣ Probar en la UI

                                                                    1. Ve a **Casos Activos**
                                                                    2. Selecciona un caso con estado "Activo"
                                                                    3. Presiona el botón **🚀 Iniciar debido proceso**
                                                                    4. El caso debe:
                                                                       - Cambiar a estado "En Seguimiento"
                                                                          - Setear fechas de inicio/vencimiento
                                                                             - Aparecer en AlertasPlazos con SLA activo
                                                                                - Navegar a la página de seguimientos

                                                                                ---

                                                                                ## 🎯 Qué hace el RPC

                                                                                Cuando se ejecuta `iniciarDebidoProceso(caseId, 10)`:

                                                                                | Campo | Acción |
                                                                                |-------|--------|
                                                                                | `seguimiento_started_at` | Se setea a `now()` (solo si no existe) |
                                                                                | `indagacion_start_date` | Se setea a hoy en UTC |
                                                                                | `indagacion_due_date` | Se calcula: `start_date + 10 días hábiles` |
                                                                                | `status` | Cambia de "Activo" → "En Seguimiento" |

                                                                                Después de esto:
                                                                                - El caso aparece en `v_control_alertas`
                                                                                - Comienza el conteo de días restantes
                                                                                - Las alertas (🔴/🟠/🟡) se calculan automáticamente

                                                                                ---

                                                                                ## 🔍 Verificar que funciona

                                                                                ### En Supabase:

                                                                                ```sql
                                                                                select 
                                                                                  id,
                                                                                    status,
                                                                                      seguimiento_started_at,
                                                                                        indagacion_start_date,
                                                                                          indagacion_due_date
                                                                                          from public.cases
                                                                                          where id = 'el-id-del-caso';
                                                                                          ```

                                                                                          ### En v_control_alertas:

                                                                                          ```sql
                                                                                          select * from v_control_alertas
                                                                                          where case_id = 'el-id-del-caso';
                                                                                          ```

                                                                                          Deberías ver una fila con:
                                                                                          - `dias_restantes` = número entre 0 y 10
                                                                                          - `alerta_urgencia` = emoji según días restantes

                                                                                          ---

                                                                                          ## 📚 Documentación relacionada

                                                                                          - `TEMPORALIDAD_DEBIDO_PROCESO.md` - Lógica de cálculo de plazos
                                                                                          - `CHANGELOG_BACKEND_DRIVEN_SLA.md` - Migración a SLA backend-driven
                                                                                          - `docs/MIGRATIONS_RUNBOOK.md` - Guía de migraciones

                                                                                          ---

                                                                                          ## ✅ Ventajas de este enfoque

                                                                                          1. **No hay casos "vencidos" antes de iniciar:** El SLA solo empieza cuando presionas el botón
                                                                                          2. **Consistencia:** Fechas calculadas en DB con días hábiles reales
                                                                                          3. **Auditoría:** Queda `seguimiento_started_at` como marca formal
                                                                                          4. **UI simple:** Un solo botón que hace todo el setup
                                                                                          5. **Coherencia con proceso real:** Refleja cuándo efectivamente se inicia la indagación

                                                                                          ---

                                                                                          ## 🆘 Troubleshooting

                                                                                          ### Error: "permission denied for function start_due_process"
                                                                                          → Falta crear la policy de RLS (paso 2)

                                                                                          ### Error: "function add_business_days does not exist"
                                                                                          → Falta crear la función `add_business_days` (ver `TEMPORALIDAD_DEBIDO_PROCESO.md`)

                                                                                          ### El caso no aparece en AlertasPlazos
                                                                                          → Verifica que `v_control_alertas` esté devolviendo la fila:
                                                                                          ```sql
                                                                                          select * from v_control_alertas where case_id = 'el-id';
                                                                                          ```

                                                                                          ### El botón no hace nada
                                                                                          → Abre la consola del navegador (F12) y busca errores

                                                                                          ---

                                                                                          ## 🎉 ¡Listo!

                                                                                          El sistema ahora permite iniciar formalmente el debido proceso con SLA de 10 días hábiles.
                                                                                          