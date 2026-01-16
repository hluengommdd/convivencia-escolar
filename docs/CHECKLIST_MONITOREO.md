# ✅ Checklist de Monitorización Post-SQL

## 📊 Fase 1: Verificar Supabase (SQL Ejecutada)

### ✅ CHECK 1: stage_sla es correcto
**En Supabase SQL Editor**, ejecuta:
```sql
SELECT 
  stage_key,
  days_to_due,
  CASE 
    WHEN days_to_due IS NULL THEN '✅ SIN PLAZO'
    ELSE '✅ CON PLAZO'
  END as tipo
FROM public.stage_sla
ORDER BY stage_key;
```

**Resultado esperado**:
```
1. Comunicación/Denuncia         | 1     | ✅ CON PLAZO
2. Notificación Apoderados       | 1     | ✅ CON PLAZO
3. Recopilación Antecedentes     | NULL  | ✅ SIN PLAZO
4. Entrevistas                   | NULL  | ✅ SIN PLAZO
5. Investigación/Análisis        | 10    | ✅ CON PLAZO
6. Resolución y Sanciones        | 1     | ✅ CON PLAZO
7. Apelación/Recursos            | 2     | ✅ CON PLAZO
```

**Status**: [ ] Verificado ✅

---

### ✅ CHECK 2: RPC start_due_process actualizado
**En Supabase → Stored Procedures**:
- Abre: `start_due_process`
- Busca la línea: `status in ('Reportado', 'Activo')`
- Debe existir (no solo `'Activo'`)

**Status**: [ ] Verificado ✅

---

### ✅ CHECK 3: action_type sin NULL
**En Supabase SQL Editor**:
```sql
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN action_type IS NULL THEN 1 END) as null_count
FROM public.case_followups;
```

**Resultado esperado**: `null_count = 0` o muy bajo

**Status**: [ ] Verificado ✅

---

### ✅ CHECK 4: due_dates válidas
**En Supabase SQL Editor**:
```sql
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN due_date >= action_date THEN 1 END) as validos,
  COUNT(CASE WHEN due_date < action_date THEN 1 END) as invalidos
FROM public.case_followups
WHERE action_date IS NOT NULL;
```

**Resultado esperado**: `invalidos = 0` (o muy bajo)

**Status**: [ ] Verificado ✅

---

### ✅ CHECK 5: Trinity específicamente
**En Supabase SQL Editor**:
```sql
SELECT 
  c.id,
  c.status,
  s.first_name,
  c.seguimiento_started_at,
  c.indagacion_start_date,
  c.indagacion_due_date
FROM public.cases c
JOIN public.students s ON c.student_id = s.id
WHERE s.first_name LIKE '%TRINIDAD%'
LIMIT 1;
```

**Resultado esperado**:
- `status`: **'En Seguimiento'** (no 'Reportado')
- `seguimiento_started_at`: debe tener fecha
- `indagacion_due_date`: debe estar calculado

**Status**: [ ] Verificado ✅

---

## 🎨 Fase 2: Verificar Frontend (Código correcto)

### ✅ CHECK F1: db.js - createFollowup con process_stage
**Archivo**: `src/api/db.js`

```javascript
// DEBE TENER:
const processStage = fields.Etapa_Debido_Proceso || 'Seguimiento';

const { data, error } = await supabase
  .from('case_followups')
  .insert({
    case_id: casoId,
    action_type: fields.Tipo_Accion,
    process_stage: processStage,  // ✅ SIEMPRE CON VALOR
    action_date: fields.Fecha_Seguimiento,
    // ...
  })
```

**Status**: [ ] Verificado ✅

---

### ✅ CHECK F2: CaseDetailPanel - handleIniciarDebidoProceso
**Archivo**: `src/components/CaseDetailPanel.jsx`

```javascript
// DEBE TENER:
async function handleIniciarDebidoProceso(e) {
  await iniciarDebidoProceso(caso.id, 10)
  emitDataUpdated()                    // ✅ Emitir evento
  setRefreshKey?.(k => k + 1)          // ✅ Refresh
  await new Promise(resolve => setTimeout(resolve, 1000))  // ✅ Delay
  const casoActualizado = await getCase(caso.id)  // ✅ Recargar
  setCaso(casoActualizado)
}
```

**Status**: [ ] Verificado ✅

---

### ✅ CHECK F3: Seguimientos - Lógica del botón "Cierre de caso"
**Archivo**: `src/pages/Seguimientos.jsx`

```javascript
// El botón debe mostrar cuando estado === 'en seguimiento'
{caso?.fields?.Estado?.toLowerCase() === 'en seguimiento' && (
  <button onClick={handleCierreCaso}>
    Cierre de caso
  </button>
)}
```

**Status**: [ ] Verificado ✅

---

### ✅ CHECK F4: Sidebar - Listener para "Seguimientos"
**Archivo**: `src/components/Sidebar.jsx`

```javascript
// DEBE TENER:
import { onDataUpdated } from '../utils/refreshBus'

useEffect(() => {
  const unsubscribe = onDataUpdated(() => {
    // Refrescar casos en seguimiento
    loadCasesEnSeguimiento()
  })
  return () => unsubscribe()
}, [])
```

**Status**: [ ] Verificado ✅

---

## 🧪 Fase 3: Tests en la Aplicación

### 🧪 TEST 1: Trinidad transiciona correctamente
**Pasos**:
1. Ir a **Casos Activos**
2. Buscar a **Trinidad**
3. Debe estar en estado **"Reportado"** (rojo)
4. Click en botón **"Iniciar debido proceso"**
5. Esperar 2-3 segundos
6. Verificar que Trinidad ahora está **"En Seguimiento"** (verde)

**Resultado esperado**: ✅ Trinidad cambió de color

**Status**: [ ] Completado ✅

---

### 🧪 TEST 2: Trinidad aparece en "Seguimientos"
**Pasos**:
1. Ir a **Seguimientos** (sidebar)
2. Debe aparecer **Trinidad** en la lista
3. Puede hacer click en ella
4. Debe ver el formulario de "Nuevo Seguimiento"

**Resultado esperado**: ✅ Trinidad visible en Seguimientos

**Status**: [ ] Completado ✅

---

### 🧪 TEST 3: Guardar seguimiento SIN ERROR 400
**Pasos**:
1. En **Seguimientos** de Trinidad
2. Llenar formulario:
   - Tipo de acción: `Entrevista`
   - Etapa: `4. Entrevistas`
   - Fecha: `16/01/2026`
3. Click **"Guardar"**
4. Verificar que guarde sin ERROR

**Resultado esperado**: ✅ Seguimiento guardado, notificación OK

**Status**: [ ] Completado ✅

---

### 🧪 TEST 4: Botón "Cierre de caso" aparece
**Pasos**:
1. En **Seguimientos** de Trinidad
2. Scroll down hasta el final
3. Debe ver botón **"Cierre de caso"** (rojo)

**Resultado esperado**: ✅ Botón visible

**Status**: [ ] Completado ✅

---

### 🧪 TEST 5: Otros casos siguen funcionando
**Pasos**:
1. Verificar otros casos activos (AGUSTIN, FLORENCIA)
2. Deben verse igual que antes
3. No debe romper nada existente

**Resultado esperado**: ✅ Sin cambios negativos

**Status**: [ ] Completado ✅

---

## 📝 Resumen de ejecución

| Fase | Check | Status |
|------|-------|--------|
| BD   | stage_sla correcto | [ ] |
| BD   | RPC actualizado | [ ] |
| BD   | action_type sin NULL | [ ] |
| BD   | due_dates válidas | [ ] |
| BD   | Trinity status correcto | [ ] |
| FE   | db.js correcto | [ ] |
| FE   | CaseDetailPanel correcto | [ ] |
| FE   | Seguimientos correcto | [ ] |
| FE   | Sidebar correcto | [ ] |
| APP  | Trinidad transiciona | [ ] |
| APP  | Trinidad en Seguimientos | [ ] |
| APP  | Guardar sin ERROR 400 | [ ] |
| APP  | Botón Cierre visible | [ ] |
| APP  | Otros casos OK | [ ] |

---

## 🎯 Signos de éxito

✅ **Si todo funciona**:
1. Trinidad sale de "Reportado"
2. Aparece en "Seguimientos" 
3. Se pueden registrar acciones sin ERROR 400
4. Los botones aparecen correctamente
5. El sistema no se rompió

❌ **Si hay problemas**:
- Revisar que SQL se ejecutó completamente
- Verificar que frontend tiene cambios guardados
- Hacer refresh del navegador (Ctrl+Shift+R)
- Revisar console del navegador (F12)

