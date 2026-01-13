# 🚀 Changelog: Backend-Driven SLA Implementation

**Fecha:** 13 de enero de 2026  
**Tipo:** Refactor técnico  
**Objetivo:** Migrar el cálculo de SLA (Service Level Agreement) del frontend hacia Supabase (backend)

---

## 📋 Resumen Ejecutivo

El sistema de control de plazos (SLA) ahora es **100% backend-driven**. Supabase es la única fuente de verdad para:
- Cálculo de fechas de vencimiento (`due_date`)
- Días restantes/vencidos (`days_to_due`)
- Etapa del proceso (`stage_num_from`)

El frontend **solo visualiza** los datos calculados por el backend, eliminando lógica duplicada y garantizando consistencia.

---

## 🔧 Cambios Implementados

### 1. ✅ Nueva función `getAllControlPlazos()`

**Archivo:** `src/api/db.js`

Creada función dedicada para obtener control de plazos **sin filtrar por caso**:

```javascript
export async function getAllControlPlazos() {
  const { data, error } = await withRetry(() =>
    supabase
      .from('v_control_plazos_plus')
      .select('*')
      .order('dias_restantes', { ascending: true })
  )
  if (error) throw error
  return (data || []).map(mapControlPlazoRow)
}
```

**Razón:** `getControlPlazos(caseId)` requiere `caseId` válido. Las vistas globales (Dashboard, AlertasPlazos) necesitaban una función sin este requisito.

---

### 2. ✅ Corregidas llamadas en vistas globales

**Archivos afectados:**
- `src/pages/Dashboard.jsx` (línea 70)
- `src/pages/AlertasPlazos.jsx` (línea 21)

**Antes:**
```javascript
getControlPlazos()  // ⚠️ Sin caseId → retornaba []
```

**Después:**
```javascript
getAllControlPlazos()  // ✅ Query global correcta
```

**Impacto:** Dashboard y Alertas ahora **muestran datos reales** en lugar de arrays vacíos.

---

### 3. ✅ Eliminado `due_date` del payload

**Archivo:** `src/api/db.js` (línea 320)

**Antes:**
```javascript
{
  case_id: fields.Caso_ID,
  action_date: fields.Fecha_Seguimiento || new Date().toISOString().split('T')[0],
  // ...otros campos...
  due_date: fields.Fecha_Plazo || null,  // ❌ Frontend calculaba
}
```

**Después:**
```javascript
{
  case_id: fields.Caso_ID,
  action_date: fields.Fecha_Seguimiento || new Date().toISOString().split('T')[0],
  // ...otros campos...
  // ✅ due_date eliminado: el trigger de Supabase lo calcula
}
```

**Razón:** El trigger `case_followups_set_due_date` en Supabase calcula automáticamente `due_date` basándose en la tabla `stage_sla`. Frontend NO debe enviarlo.

---

### 4. ✅ Cálculo de vencimientos migrado a backend

**Archivo:** `src/components/ProcesoVisualizer.jsx` (líneas 65-100)

**Antes (frontend calculaba):**
```javascript
const hoy = new Date()
const fechaSeg = new Date(seg.fields.Fecha_Seguimiento)
const diasTranscurridos = Math.floor((hoy - fechaSeg) / (1000 * 60 * 60 * 24))

if (diasTranscurridos > etapa.plazoMaxDias) {
  etapasVencidas.push({
    numero: etapa.numero,
    nombre: etapa.nombre,
    diasVencidos: diasTranscurridos - etapa.plazoMaxDias
  })
}
```

**Después (backend decide):**
```javascript
const days = seguimiento?.fields?.days_to_due

if (
  typeof days === 'number' &&
  days < 0 &&  // ✅ Negativo = vencido (backend lo calcula)
  !etapasCompletadas.has(etapa.numero)
) {
  etapasVencidas.push({
    numero: etapa.numero,
    nombre: etapa.nombre,
    diasVencidos: Math.abs(days),
  })
}
```

**Impacto:** Eliminada lógica de fechas manual. El componente usa directamente `days_to_due` de `v_control_plazos_plus`.

---

### 5. ✅ Limpieza de constantes hardcodeadas

**Archivo:** `src/components/ProcesoVisualizer.jsx` (líneas 3-12)

**Antes:**
```javascript
const ETAPAS_PROCESO = [
  { numero: 1, nombre: '1. Comunicación/Denuncia', corto: 'Denuncia', plazoMaxDias: 2 },
  { numero: 2, nombre: '2. Notificación Apoderados', corto: 'Notificación', plazoMaxDias: 2 },
  // ...etc con plazoMaxDias hardcodeado
]
```

**Después:**
```javascript
const ETAPAS_PROCESO = [
  { numero: 1, nombre: '1. Comunicación/Denuncia', corto: 'Denuncia' },
  { numero: 2, nombre: '2. Notificación Apoderados', corto: 'Notificación' },
  // ...solo nombres/labels, SIN plazos
]
```

**Razón:** Los plazos legales viven en `stage_sla` de Supabase. Frontend no debe tener esta información duplicada.

---

## 📊 Archivos Modificados

| Archivo | Líneas | Tipo de Cambio |
|---------|--------|----------------|
| `src/api/db.js` | 337-348 | Función nueva: `getAllControlPlazos()` |
| `src/api/db.js` | 320 | Eliminado: `due_date` del payload |
| `src/pages/Dashboard.jsx` | 27, 70 | Import y uso de `getAllControlPlazos()` |
| `src/pages/AlertasPlazos.jsx` | 4, 21 | Import y uso de `getAllControlPlazos()` |
| `src/components/ProcesoVisualizer.jsx` | 3-12 | Eliminado `plazoMaxDias` de constantes |
| `src/components/ProcesoVisualizer.jsx` | 65-84 | Reemplazado cálculo manual por `days_to_due` |

---

## ✅ Verificaciones Realizadas

- ✅ Build compila sin errores (Vite 7.3.0)
- ✅ No hay referencias a `plazoMaxDias` en código fuente
- ✅ No hay referencias a `diasTranscurridos` en código fuente
- ✅ No hay envío de `due_date` en payloads
- ✅ `getControlPlazos(caseId)` mantiene su contrato original
- ✅ Vistas globales usan función dedicada `getAllControlPlazos()`

---

## 🎯 Beneficios Técnicos

### Antes (Frontend-Driven SLA)
❌ Lógica de SLA duplicada (frontend + backend)  
❌ Frontend calculaba fechas/plazos manualmente  
❌ Constantes hardcodeadas en JavaScript  
❌ Riesgo de inconsistencia entre frontend/backend  
❌ Cambios en SLA requieren deploy de frontend  

### Después (Backend-Driven SLA)
✅ Supabase es única fuente de verdad  
✅ Frontend solo visualiza datos calculados  
✅ Plazos legales centralizados en tabla `stage_sla`  
✅ Consistencia garantizada por backend  
✅ Cambios en SLA: solo actualizar DB, sin redeploy  

---

## 📚 Documentación Relacionada

- **Vista Backend:** `v_control_plazos_plus` expone `days_to_due`, `stage_num_from`
- **Trigger:** `case_followups_set_due_date` calcula `due_date` automáticamente
- **Tabla SLA:** `stage_sla` define plazos por etapa del debido proceso
- **Auditoría completa:** Ver `AUDITORIA_BACKEND_DRIVEN_SLA.md`
- **Contexto legal:** Ver `TEMPORALIDAD_DEBIDO_PROCESO.md`

---

## 🚦 Estado

**✅ Implementación completa y verificada**

Cambios locales listos para PR. No pushed a repositorio remoto (pendiente revisión).

**Próximo paso:** Crear PR con título:
```
feat: enforce backend-driven SLA (Supabase as source of truth)
```

---

## 👥 Impacto en Usuarios

**Usuario final:** Sin cambios visibles. Misma funcionalidad, mejor arquitectura.  
**Administrador:** Puede modificar SLA desde Supabase sin tocar código frontend.  
**Desarrollador:** Código más limpio, menos lógica de negocio en cliente.
