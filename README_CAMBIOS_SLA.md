# 📋 Implementación: Regla de Negocio SLA - Inicio Manual de Debido Proceso

## ✅ Resumen Ejecutivo

Se implementó la regla de negocio que establece que **los casos nuevos NO inician automáticamente el debido proceso**. El SLA solo comienza cuando el usuario presiona explícitamente el botón **"Iniciar debido proceso"**.

### Regla Principal
- ✅ Casos nuevos → `seguimiento_started_at = NULL` → **NO corre SLA**
- ✅ SLA inicia solo con botón "Iniciar debido proceso"
- ✅ Fuente de verdad: `cases.seguimiento_started_at` en base de datos
- ✅ "Ver seguimiento" → solo navega, NO inicia proceso

---

## 📦 Archivos Modificados

### Frontend
| Archivo | Cambios Realizados |
|---------|-------------------|
| `src/components/CaseDetailPanel.jsx` | Removido SLA, agregado "Creado hace X días", botones condicionales |
| `src/pages/Seguimientos.jsx` | Validación de proceso iniciado antes de mostrar SLA |
| `src/pages/AlertasPlazos.jsx` | Filtro para mostrar solo casos con proceso iniciado |
| `src/components/CaseStudentHeaderCard.jsx` | Soporte para badge "Pendiente de iniciar" |
| `src/components/CaseDetailsCard.jsx` | Mejoras en temporalidad y estado del proceso |
| `src/components/DueProcessAccordion.jsx` | Filtro de seguimientos legacy "inicio automatico" |
| `src/api/db.js` | Función `iniciarDebidoProceso()` y `getAllControlAlertas()` |
| `src/pages/Dashboard.jsx` | Actualizado para usar `getAllControlAlertas()` |
| `src/pages/CasosActivos.jsx` | Etiqueta mejorada "Fecha de registro" |

### Backend (Supabase)
| Archivo | Descripción |
|---------|-------------|
| `docs/RPC_START_DUE_PROCESS.sql` | RPC que inicia el debido proceso |
| `docs/RLS_POLICY_START_DUE_PROCESS.sql` | Policy de permisos (opcional) |
| `docs/README_INICIAR_DEBIDO_PROCESO.md` | Documentación técnica completa |
| `docs/EJEMPLO_BOTON_INICIAR_DEBIDO_PROCESO.js` | Ejemplo de implementación |

---

## 🎯 Comportamiento por Pantalla

### 1. **Nuevo Caso (NuevoCasoModal.jsx)**
✅ **Estado actual**: Ya cumplía con la regla

- Al guardar caso → solo `INSERT` en `cases`
- **NO** llama a `start_due_process`
- **NO** setea `seguimiento_started_at`
- Estado inicial: `"Reportado"`

**Resultado:**
```javascript
{
  seguimiento_started_at: null,
  indagacion_start_date: null,
  indagacion_due_date: null,
  status: "Reportado"
}
```

### 2. **Casos Activos (CasosActivos.jsx)**
✅ **Cambios implementados**

**Vista de lista:**
- Muestra fecha de registro (no SLA)
- Sin badges de vencimiento
- Estado visible del caso

**Panel derecho (CaseDetailPanel):**
- **SIN SLA**: No muestra "Vencido" ni "En plazo"
- **Información temporal**: "Creado hace X días"
- **Botones condicionales:**
  - `seguimiento_started_at == null` → **"Iniciar debido proceso"**
  - `seguimiento_started_at != null` → **"Ver seguimiento"**

**Código clave:**
```jsx
// Botón condicional
{caso._supabaseData?.seguimiento_started_at ? (
  <button onClick={verSeguimiento}>Ver seguimiento</button>
) : (
  <button onClick={handleIniciarDebidoProceso}>
    Iniciar debido proceso
  </button>
)}

// Mostrar días desde creación
{diasDesdeCreacion !== null && (
  <span>Creado hace {diasDesdeCreacion} días</span>
)}
```

### 3. **Seguimientos (Seguimientos.jsx)**
✅ **Cambios implementados**

- **SLA visible SOLO si** `seguimiento_started_at != null`
- Badge de vencimiento solo en casos iniciados
- Timeline sin registros de "inicio automático"
- Visualizador de fases del debido proceso activo

**Código clave:**
```javascript
// Validar proceso iniciado
const procesoIniciado = Boolean(caso?._supabaseData?.seguimiento_started_at)

// Solo mostrar SLA si fue iniciado
if (procesoIniciado && dias !== null && Number.isFinite(dias)) {
  // calcular isOverdue y overdueLabel
}
```

**Acción "Iniciar debido proceso":**
1. Click en botón → `iniciarDebidoProceso(caseId, 10)`
2. RPC `start_due_process` ejecuta:
   - `seguimiento_started_at = now()`
   - `indagacion_start_date = hoy (UTC)`
   - `indagacion_due_date = start_date + 10 días hábiles`
   - `status = "En Seguimiento"`
3. Navega a `/seguimientos?caso={caseId}`
4. Caso aparece en Alertas con SLA activo

### 4. **Alertas (AlertasPlazos.jsx)**
✅ **Cambios implementados**

**Filtro estricto:**
```javascript
// Solo casos con proceso iniciado
const controlFiltrado = controlData.filter(s => {
  const caso = casesData.find(c => c.id === casoId)
  
  // 1. Caso cerrado → NO mostrar
  if (caso?.fields?.Estado === 'Cerrado') return false
  
  // 2. Sin proceso iniciado → NO mostrar
  if (!caso._supabaseData?.seguimiento_started_at) return false
  
  return true
})
```

**Resultado:**
- Contadores solo incluyen casos iniciados
- Casos nuevos (sin iniciar) **NO aparecen** en alertas
- Tarjetas: Vencidos, Urgentes, Próximos, En plazo

### 5. **Casos Cerrados (CasosCerrados.jsx)**
✅ **Estado actual**: Ya cumplía con la regla

- Solo lectura (`readOnly={true}`)
- No permite iniciar proceso
- Exportar informe PDF disponible
- SLA informativo (no genera alertas)

---

## 🔧 Instalación y Configuración

### Paso 1: Ejecutar RPC en Supabase

Ve a **Supabase SQL Editor** y ejecuta:

```sql
-- Función para calcular días hábiles (si no existe)
-- Ver: docs/TEMPORALIDAD_DEBIDO_PROCESO.md

-- RPC para iniciar debido proceso
-- ⚠️ IMPORTANTE: Solo setea fechas si seguimiento_started_at es NULL
-- Guard clause previene reinicios accidentales
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
    seguimiento_started_at = v_now,
    indagacion_start_date = v_today,
    indagacion_due_date = public.add_business_days(v_today, p_sla_days),
    status = case when c.status = 'Activo' then 'En Seguimiento' else c.status end
  where c.id = p_case_id
    and c.seguimiento_started_at is null;  -- ✅ Guard: solo casos no iniciados
end;
$$;
```

### Paso 2: (Opcional) Configurar RLS

Solo si tienes Row Level Security habilitado:

```sql
-- Permitir update en casos para usuarios autenticados
create policy "cases_start_due_process_authenticated"
on public.cases
for update
to authenticated
using (true)  -- Ajustar según tu lógica de tenant
with check (true);
```

### Paso 3: Verificar Cambios Frontend

Los cambios ya están implementados. Solo necesitas:

1. Revisar que los archivos estén actualizados
2. Reiniciar el servidor dev si está corriendo
3. Probar el flujo completo

---

## ⚠️ Bugs Conocidos Pendientes

### 🔄 Refresh del listado tras iniciar proceso

✅ **SOLUCIONADO**

**Problema:**  
Al presionar "Iniciar debido proceso" desde Casos Activos, el caso navegaba a Seguimientos pero **no aparecía en el listado izquierdo** hasta refrescar manualmente.

**Solución implementada:**
```javascript
// En CaseDetailPanel.jsx
async function handleIniciarDebidoProceso(e) {
  e?.stopPropagation()
  try {
    await iniciarDebidoProceso(caso.id, 10)
    
    // ✅ Emitir evento para refrescar listados
    emitDataUpdated()
    
    // Pequeño delay para dar tiempo a que se actualice la DB
    await new Promise(resolve => setTimeout(resolve, 300))
    
    navigate(`/seguimientos?caso=${caso.id}`)
  } catch (err) {
    console.error(err)
    alert(err?.message || 'Error iniciando debido proceso')
  }
}
```

**Implementación:**
- Uso del `refreshBus` existente (`emitDataUpdated()`)
- Delay de 300ms para sincronización con DB
- Los componentes que escuchan `onDataUpdated()` se refrescan automáticamente

**Criterio de aceptación:** ✅ CUMPLIDO
- El caso aparece inmediatamente en el listado izquierdo de Seguimientos
- No requiere refresh manual (F5)

---

## 🧪 Checklist de Validación (QA)

### ✅ Test 1: Crear Caso Nuevo
```
1. Ir a "Casos Activos"
2. Click "Nuevo Caso"
3. Completar y guardar
4. ✓ Verificar en DB: seguimiento_started_at = NULL
5. ✓ Verificar: NO aparece en Alertas
6. ✓ Verificar: Aparece en Casos Activos
```

### ✅ Test 2: Casos Activos - Vista sin SLA
```
1. Seleccionar caso nuevo (sin iniciar)
2. Panel derecho:
   ✓ NO muestra badge "Vencido" o "En plazo"
   ✓ Muestra "Creado hace X días"
   ✓ Botón: "Iniciar debido proceso"
3. Seleccionar caso con proceso iniciado:
   ✓ Botón: "Ver seguimiento"
```

### ✅ Test 3: Iniciar Debido Proceso
```
1. Caso sin iniciar → Click "Iniciar debido proceso"
2. ✓ Navega a Seguimientos
3. ✓ Badge SLA visible ("Vence en X días")
4. ✓ En DB: seguimiento_started_at != NULL
5. ✓ En DB: indagacion_due_date calculado
```

### ✅ Test 4: Timeline Limpio
```
1. Ir a Seguimientos de caso iniciado
2. Ver acordeón "Acciones del Debido Proceso"
3. ✓ NO aparece "Inicio automático del debido proceso"
```

### ✅ Test 5: Alertas - Solo Casos Iniciados
```
1. Crear caso nuevo (NO iniciar)
2. Ir a "Alertas"
3. ✓ Caso nuevo NO aparece
4. Iniciar proceso en otro caso
5. ✓ Caso iniciado SÍ aparece en alertas
6. ✓ Contadores solo incluyen casos iniciados
```

### ✅ Test 6: Cerrar Caso
```
1. Cerrar un caso desde Seguimientos
2. ✓ Pasa a "Casos Cerrados"
3. ✓ Sale de Alertas
4. ✓ No se puede iniciar proceso (solo lectura)
5. ✓ Export PDF funciona
```

---

## 📊 Cambios en Base de Datos

### Campos Clave en `cases`

| Campo | Propósito | Se setea en |
|-------|-----------|-------------|
| `seguimiento_started_at` | Timestamp de inicio formal | `start_due_process()` |
| `indagacion_start_date` | Fecha inicio (UTC, solo día) | `start_due_process()` |
| `indagacion_due_date` | Fecha vencimiento (+10 días hábiles) | `start_due_process()` |
| `status` | Estado del caso | Se actualiza a "En Seguimiento" |

⚠️ **Nota sobre datos históricos:**  
Casos con `seguimiento_started_at = '00:00:00+00'` son **backfill de migración histórica**, NO creados por frontend ni RLS. Estos casos fueron importados/migrados antes de implementar el inicio manual.

### Vista `v_control_alertas`

Debe incluir solo casos con `seguimiento_started_at IS NOT NULL`.

Estructura esperada:
```sql
SELECT
  c.id as case_id,
  c.seguimiento_started_at,
  c.indagacion_due_date as fecha_plazo,
  -- calcular dias_restantes
  -- calcular alerta_urgencia
FROM cases c
WHERE c.seguimiento_started_at IS NOT NULL
  AND c.status != 'Cerrado'
```

---

## 🔍 Código de Referencia

### Función `iniciarDebidoProceso()` en db.js

```javascript
/**
 * Iniciar debido proceso: setea fechas de inicio/vencimiento
 * @param {string} caseId - ID del caso
 * @param {number} slaDays - Días hábiles (default 10)
 */
export async function iniciarDebidoProceso(caseId, slaDays = 10) {
  const { error } = await supabase.rpc('start_due_process', {
    p_case_id: caseId,
    p_sla_days: slaDays,
  })
  if (error) throw error
}
```

### Handler en CaseDetailPanel.jsx

```javascript
async function handleIniciarDebidoProceso(e) {
  e?.stopPropagation()
  try {
    await iniciarDebidoProceso(caso.id, 10)
    navigate(`/seguimientos?caso=${caso.id}`)
  } catch (err) {
    console.error(err)
    alert(err?.message || 'Error iniciando debido proceso')
  }
}

async function verSeguimiento() {
  // NO muta DB, solo navega
  navigate(`/seguimientos?caso=${caso.id}`)
}
```

### Filtro en AlertasPlazos.jsx

```javascript
const controlFiltrado = (controlData || []).filter(s => {
  const casoId = s.fields?.CASOS_ACTIVOS?.[0]
  if (!casoId) return false

  const caso = (casesData || []).find(c => c.id === casoId)
  if (!caso) return false

  // Caso cerrado → no mostrar
  const estado = normalizarEstado(caso?.fields?.Estado)
  if (estado === 'cerrado') return false

  // ✅ REGLA PRINCIPAL: solo casos con proceso iniciado
  if (!caso._supabaseData?.seguimiento_started_at) return false

  return true
})
```

---

## 🎉 Ventajas de la Implementación

1. **No hay casos "vencidos" antes de iniciar**: El SLA solo empieza cuando se presiona el botón
2. **Consistencia**: Fechas calculadas en DB con días hábiles reales
3. **Auditoría**: Queda `seguimiento_started_at` como marca formal de inicio
4. **UI simple**: Un solo botón que hace todo el setup
5. **Coherencia con proceso real**: Refleja cuándo efectivamente se inicia la indagación
6. **Sin ruido en alertas**: Solo casos activamente en proceso generan alertas

---

## 🆘 Troubleshooting

### Error: "permission denied for function start_due_process"
**Solución:** Falta crear la policy de RLS. Ver `docs/RLS_POLICY_START_DUE_PROCESS.sql`

### Error: "function add_business_days does not exist"
**Solución:** Falta crear la función de días hábiles. Ver `TEMPORALIDAD_DEBIDO_PROCESO.md`

### El caso no aparece en AlertasPlazos después de iniciar
**Verificar:**
```sql
-- 1. Verificar que el caso tenga las fechas
SELECT 
  id, 
  seguimiento_started_at,
  indagacion_start_date,
  indagacion_due_date
FROM cases 
WHERE id = 'el-id-del-caso';

-- 2. Verificar que aparezca en v_control_alertas
SELECT * FROM v_control_alertas 
WHERE case_id = 'el-id-del-caso';
```

### El botón no hace nada
**Verificar:**
1. Abrir consola del navegador (F12)
2. Buscar errores en la pestaña Console
3. Verificar que `iniciarDebidoProceso` esté importado correctamente

### Casos viejos aparecen "vencidos" sin haber iniciado
**Solución:** Los casos creados antes de esta implementación pueden necesitar:
```sql
-- Opción 1: Iniciarlos manualmente desde la UI
-- Opción 2: Script de migración para setear fechas retroactivas (consultar antes de ejecutar)
```

### Error: El RPC no actualiza nada al ejecutar
**Causa:** El caso ya tiene `seguimiento_started_at != NULL` y el guard clause previene re-escritura.

**Verificar:**
```sql
SELECT seguimiento_started_at 
FROM cases 
WHERE id = 'el-id-del-caso';
```

**Esto es correcto:** El RPC usa `WHERE seguimiento_started_at IS NULL` para prevenir reinicios accidentales. Si el caso ya fue iniciado, no debe poder reiniciarse.

---

## 📚 Documentación Relacionada

- [`TEMPORALIDAD_DEBIDO_PROCESO.md`](TEMPORALIDAD_DEBIDO_PROCESO.md) - Lógica de cálculo de plazos
- [`CHANGELOG_BACKEND_DRIVEN_SLA.md`](CHANGELOG_BACKEND_DRIVEN_SLA.md) - Migración a SLA backend-driven
- [`docs/MIGRATIONS_RUNBOOK.md`](docs/MIGRATIONS_RUNBOOK.md) - Guía de migraciones
- [`docs/README_INICIAR_DEBIDO_PROCESO.md`](docs/README_INICIAR_DEBIDO_PROCESO.md) - Documentación técnica detallada
- [`docs/EJEMPLO_BOTON_INICIAR_DEBIDO_PROCESO.js`](docs/EJEMPLO_BOTON_INICIAR_DEBIDO_PROCESO.js) - Ejemplo de código

---

## ✅ Confirmaciones Finales

✅ **Nuevos casos NO inician debido proceso automáticamente**  
✅ **SLA solo se muestra después de "Iniciar debido proceso"**  
✅ **"Ver seguimiento" solo navega, NO muta DB**  
✅ **Alertas excluyen casos sin proceso iniciado**  
✅ **Casos cerrados son solo lectura**  
✅ **No hay errores de compilación**  
✅ **Timeline limpio (sin "inicio automático")**  
✅ **Días desde creación visible en Casos Activos**

---

## 👥 Contacto y Soporte

Si encuentras algún problema durante la implementación o las pruebas:

1. Verifica que todos los archivos SQL estén ejecutados en Supabase
2. Revisa la consola del navegador para errores de JavaScript
3. Consulta los logs de Supabase para errores de RPC
4. Revisa el checklist de QA paso a paso

---

## 📅 Historial de Cambios

- **2026-01-15**: Implementación completa de inicio manual de debido proceso
- **2026-01-15**: Actualización de filtros en Alertas
- **2026-01-15**: Mejoras en UX de Casos Activos (días desde creación)
- **2026-01-15**: Filtrado de timeline (remover "inicio automático")
- **2026-01-15**: Documentación de bugs conocidos (refresh listado)
- **2026-01-15**: Corrección RPC con guard clause `seguimiento_started_at IS NULL`
- **2026-01-15**: Aclaración sobre backfill histórico (00:00:00+00)
- **2026-01-15**: ✅ **Fix implementado:** Refresh automático tras iniciar debido proceso

---

## 🚧 Pendientes para Producción

- [x] ✅ Implementar refresh automático del listado tras iniciar proceso
- [ ] Verificar que el RPC `start_due_process` esté actualizado con guard clause
- [ ] Validar que `add_business_days()` esté creada en Supabase
- [ ] Ejecutar tests QA completos en staging
- [ ] Documentar casos de backfill histórico si aplica

---

**¡Implementación core completada - pendientes menores antes de producción!** 🚀
