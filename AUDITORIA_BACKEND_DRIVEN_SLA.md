# Auditoría: Backend-Driven SLA

**Fecha:** 13 de enero de 2026  
**Objetivo:** Verificar que el frontend consume `v_control_plazos_plus` y NO calcula SLA localmente.

---

## ✅ Verificaciones Exitosas

### 1. Vista Correcta en Backend
- **✅ Confirmado:** La función `getControlPlazos()` consulta `v_control_plazos_plus`
- **Ubicación:** `src/api/db.js` línea 347
```javascript
.from('v_control_plazos_plus')  // ✅ Vista correcta
```

### 2. Guard Clause Implementado
- **✅ Confirmado:** Existe validación para evitar queries con `caseId` vacío
- **Ubicación:** `src/api/db.js` líneas 342-343
```javascript
if (!caseId) return []
```

### 3. Mapeo de Campos Backend
- **✅ Confirmado:** `mapControlPlazoRow` expone campos calculados por el backend
- **Ubicación:** `src/api/db.js` líneas 132-133
```javascript
// Backend-driven fields from v_control_plazos_plus
days_to_due: row.days_to_due ?? null,
stage_num_from: row.stage_num_from ?? null,
```

### 4. Badge UI Usa Backend
- **✅ Confirmado:** El componente visualizador usa `days_to_due` del backend
- **Ubicación:** `src/components/ProcesoVisualizer.jsx` líneas 315-317
```javascript
const d = seguimiento?.fields?.days_to_due
const badge = d == null ? '—' : `${d}d`
```

---

## ❌ Problemas Detectados

### 1. Llamadas Sin `caseId` (Crítico)

**Dashboard.jsx**
```jsx
// src/pages/Dashboard.jsx línea 70
getControlPlazos()  // ⚠️ Sin parámetro caseId
```

**AlertasPlazos.jsx**
```jsx
// src/pages/AlertasPlazos.jsx línea 21
getControlPlazos()  // ⚠️ Sin parámetro caseId
```

**Impacto:** Ambas llamadas devuelven arrays vacíos por el guard clause, ocultando datos de control de plazos.

**Solución sugerida:**
- Opción A: Cambiar firma de `getControlPlazos(caseId)` a `getControlPlazos(caseId = null)` y hacer query sin filtro si es `null`
- Opción B: Crear función separada `getAllControlPlazos()` para queries globales

---

### 2. Frontend Envía `due_date` Explícitamente (Alto)

**Ubicación:** `src/api/db.js` línea 320
```javascript
due_date: fields.Fecha_Plazo || null,  // ⚠️ Frontend manda due_date
```

**Impacto:** El frontend calcula/envía `due_date`, contradiciendo el enfoque "backend-driven". El trigger de Supabase puede no ejecutarse si el campo ya tiene valor.

**Solución sugerida:** Eliminar esta línea del payload. Dejar que el trigger `case_followups_set_due_date` calcule automáticamente.

---

### 3. Cálculo Frontend de Vencimientos (Medio)

**Ubicación:** `src/components/ProcesoVisualizer.jsx` líneas 70-93

```javascript
// ⚠️ Frontend calcula días vencidos
const diasTranscurridos = Math.floor((hoy - fechaSeg) / (1000 * 60 * 60 * 24))
if (diasTranscurridos > etapa.plazoMaxDias) {
  etapasVencidas.push({
    numero: etapa.numero,
    nombre: etapa.nombre,
    diasVencidos: diasTranscurridos - etapa.plazoMaxDias
  })
}
```

**Impacto:** Lógica duplicada. El backend ya calcula esto en `v_control_plazos_plus.days_to_due`.

**Solución sugerida:** Usar directamente `days_to_due` del backend para determinar si está vencido:
```javascript
const estaVencida = seguimiento?.fields?.days_to_due < 0
const diasVencidos = Math.abs(seguimiento?.fields?.days_to_due || 0)
```

---

### 4. Constantes Hardcodeadas (Bajo)

**Ubicación:** `src/components/ProcesoVisualizer.jsx` líneas 4-11

```javascript
const ETAPAS_PROCESO = [
  { numero: 1, nombre: '1. Comunicación/Denuncia', corto: 'Denuncia', plazoMaxDias: 2 },
  { numero: 2, nombre: '2. Notificación Apoderados', corto: 'Notificación', plazoMaxDias: 2 },
  // ... etc
]
```

**Impacto:** SLA hardcodeado en frontend. Si cambian los plazos en `stage_sla` de Supabase, el frontend no se actualiza.

**Solución sugerida:** 
- Opción A: Eliminar `plazoMaxDias` y usar solo `days_to_due` del backend
- Opción B: Mantener constantes solo para nombres/labels, eliminar campo `plazoMaxDias`

---

## 📊 Resumen de Hallazgos

| # | Problema | Severidad | Archivo | Líneas |
|---|----------|-----------|---------|--------|
| 1 | Llamadas sin `caseId` | 🔴 Crítico | Dashboard.jsx, AlertasPlazos.jsx | 70, 21 |
| 2 | Frontend envía `due_date` | 🟠 Alto | db.js | 320 |
| 3 | Cálculo frontend de vencimientos | 🟡 Medio | ProcesoVisualizer.jsx | 70-93 |
| 4 | Constantes hardcodeadas | 🟢 Bajo | ProcesoVisualizer.jsx | 4-11 |

---

## 🔧 Lista de Cambios Requeridos

### Cambio 1: Arreglar llamadas a `getControlPlazos()`

**Archivos afectados:**
- `src/api/db.js`
- `src/pages/Dashboard.jsx`
- `src/pages/AlertasPlazos.jsx`

**Implementación:**

```javascript
// Opción A: Parámetro opcional
export async function getControlPlazos(caseId = null) {
  try {
    let query = supabase
      .from('v_control_plazos_plus')
      .select('*')
      .order('dias_restantes', { ascending: true })
    
    if (caseId) {
      query = query.eq('case_id', caseId)
    }
    
    const { data, error } = await withRetry(() => query)
    // ...
  }
}
```

### Cambio 2: Eliminar envío de `due_date`

**Archivo:** `src/api/db.js` línea 320

```diff
  {
    case_id: fields.Caso_ID,
    action_date: fields.Fecha_Seguimiento || new Date().toISOString().split('T')[0],
    action_type: fields.Tipo_Accion || 'Seguimiento',
    process_stage: fields.Etapa_Debido_Proceso || '',
    detail: fields.Detalle || fields.Descripcion || '',
    responsible: fields.Responsable || fields.Acciones || '',
    stage_status: fields.Estado_Etapa || 'Completada',
    observations: fields.Observaciones || '',
    description: fields.Descripcion || '',
-   due_date: fields.Fecha_Plazo || null,
  },
```

### Cambio 3: Usar `days_to_due` del backend para vencimientos

**Archivo:** `src/components/ProcesoVisualizer.jsx` líneas 70-93

```javascript
// Reemplazar cálculo manual por datos del backend
ETAPAS_PROCESO.forEach(etapa => {
  const seguimiento = etapasConSeguimiento.get(etapa.numero)
  const daysToDeue = seguimiento?.fields?.days_to_due
  
  // Backend dice si está vencido (days_to_due < 0)
  if (daysToDeue !== null && daysToDeue < 0 && !etapasCompletadas.has(etapa.numero)) {
    etapasVencidas.push({
      numero: etapa.numero,
      nombre: etapa.nombre,
      diasVencidos: Math.abs(daysToDeue)
    })
  }
})
```

### Cambio 4: Eliminar `plazoMaxDias` de constantes

**Archivo:** `src/components/ProcesoVisualizer.jsx` líneas 4-11

```javascript
// Mantener solo información de etiquetas
const ETAPAS_PROCESO = [
  { numero: 1, nombre: '1. Comunicación/Denuncia', corto: 'Denuncia' },
  { numero: 2, nombre: '2. Notificación Apoderados', corto: 'Notificación' },
  { numero: 3, nombre: '3. Recopilación Antecedentes', corto: 'Antecedentes' },
  { numero: 4, nombre: '4. Entrevistas', corto: 'Entrevistas' },
  { numero: 5, nombre: '5. Investigación/Análisis', corto: 'Investigación' },
  { numero: 6, nombre: '6. Resolución y Sanciones', corto: 'Resolución' },
  { numero: 7, nombre: '7. Apelación/Recursos', corto: 'Apelación' },
  { numero: 8, nombre: '8. Seguimiento', corto: 'Seguimiento' },
]
```

---

## ✅ Checklist Pre-Merge

- [ ] Cambio 1: Arreglar `getControlPlazos()` para soportar queries globales
- [ ] Cambio 2: Eliminar `due_date` del payload en `createFollowup()`
- [ ] Cambio 3: Reemplazar cálculo de vencimientos con `days_to_due` del backend
- [ ] Cambio 4: Eliminar constante `plazoMaxDias` del frontend
- [ ] Verificar que Dashboard y AlertasPlazos muestran datos correctamente
- [ ] Verificar que ProcesoVisualizer muestra vencimientos correctos
- [ ] Confirmar que triggers de Supabase están activos (ejecutar queries SQL)
- [ ] Confirmar que `stage_sla` tiene datos correctos (ejecutar queries SQL)
- [ ] Validar que `v_control_plazos_plus` retorna `days_to_due` poblado

---

## 📝 Queries SQL Pendientes (Ejecutar en Supabase)

```sql
-- D1) Verificar stage_sla (SLA vigente)
SELECT stage_key, days_to_due 
FROM public.stage_sla 
ORDER BY stage_key;

-- D2) Verificar v_control_plazos_plus
SELECT etapa_debido_proceso, stage_num_from, days_to_due
FROM public.v_control_plazos_plus
ORDER BY stage_num_from NULLS LAST, etapa_debido_proceso
LIMIT 50;

-- D3) Verificar triggers activos
SELECT t.tgname, t.tgenabled
FROM pg_trigger t
JOIN pg_class c ON c.oid=t.tgrelid
JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' 
  AND c.relname='case_followups' 
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- D4) Verificar due_date nullable
SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_schema='public' 
  AND table_name='case_followups' 
  AND column_name='due_date';
```

---

## 🎯 Conclusión

**Estado Actual:** ❌ No listo para merge

**Acción Requerida:** Implementar 4 cambios críticos antes de crear PR.

**Próximos Pasos:**
1. Implementar los 4 cambios listados
2. Ejecutar queries SQL en Supabase para verificar backend
3. Probar Dashboard, AlertasPlazos y ProcesoVisualizer
4. Crear PR con título: `feat: migrate to backend-driven SLA (v_control_plazos_plus)`

---

## 📚 Referencias

- **Vista Backend:** `v_control_plazos_plus` en Supabase
- **Trigger:** `case_followups_set_due_date` para calcular `due_date`
- **Tabla SLA:** `stage_sla` con plazos por etapa
- **Documentación:** Ver `TEMPORALIDAD_DEBIDO_PROCESO.md` para contexto adicional
