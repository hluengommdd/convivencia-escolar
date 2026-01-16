# 🎯 RESUMEN EJECUTIVO: Solución completa

## Los 4 Problemas Reales

### 1️⃣ stage_sla VACÍO (Etapas 3 y 4)
```
ANTES:
3. Recopilación Antecedentes | NULL ❌
4. Entrevistas              | NULL ❌

DESPUÉS:
3. Recopilación Antecedentes | 3 días ✅
4. Entrevistas              | 5 días ✅
```

**SQL**:
```sql
UPDATE public.stage_sla SET days_to_due = 3 WHERE stage_key = '3. Recopilación Antecedentes';
UPDATE public.stage_sla SET days_to_due = 5 WHERE stage_key = '4. Entrevistas';
```

---

### 2️⃣ RPC ignora status 'Reportado'
```
ANTES:
Trinidad (Reportado) 
  → Click "Iniciar"
  → RPC: if status='Activo' ? NO
  → Sigue siendo "Reportado" ❌

DESPUÉS:
Trinidad (Reportado)
  → Click "Iniciar"
  → RPC: if status in ('Reportado','Activo') ? SÍ
  → Cambia a "En Seguimiento" ✅
```

**SQL**:
```sql
-- Cambiar en RPC:
-- DE: status = case when c.status = 'Activo' then 'En Seguimiento' else c.status end
-- A:
status = case when c.status in ('Reportado', 'Activo') then 'En Seguimiento' else c.status end
```

---

### 3️⃣ process_stage NULL en inserciones
```
ANTES:
const payload = {
  case_id: '...',
  action_date: '2026-01-16',
  action_type: 'Seguimiento',
  process_stage: null  // ❌ ERROR 400!
}

DESPUÉS:
const payload = {
  case_id: '...',
  action_date: '2026-01-16',
  action_type: 'Seguimiento',
  process_stage: 'Seguimiento'  // ✅ Valor por defecto
}
```

**JavaScript** (ya está en `src/api/db.js`):
```javascript
const processStage = fields.Etapa_Debido_Proceso || 'Seguimiento'
// Siempre tiene un valor ✅
```

---

### 4️⃣ due_dates inconsistentes
```
ANTES:
due_date = action_date (no calculado)
due_date = NULL (falta)
due_date < action_date (inválido)

DESPUÉS:
due_date = action_date + DAYS_TO_DUE (correcto)
```

**SQL**:
```sql
UPDATE public.case_followups cf
SET due_date = add_business_days(cf.action_date, s.days_to_due)
FROM public.stage_sla s
WHERE cf.process_stage = s.stage_key
  AND s.days_to_due IS NOT NULL AND s.days_to_due > 0;
```

---

## 🚀 Cómo aplicar la solución

### Paso 1: Copiar SQL
Abre: `/workspaces/convivencia-escolar/docs/SOLUCION_COMPLETA_SUPABASE.sql`

### Paso 2: Ir a Supabase
1. https://app.supabase.com/
2. Selecciona tu proyecto
3. SQL Editor (menú izquierdo)

### Paso 3: Pegar y ejecutar
1. Pegalo TODO en SQL Editor
2. Click "Run"
3. ¡Espera a que termine!

### Paso 4: Verificar
Las últimas queries te mostrarán un resumen:
```
tabla        | total | con_dias | sin_dias
stage_sla    |   7   |    7     |    0     ✅ (antes: 5)

tabla            | total | reportados | en_seguimiento | cerrados
cases            |  30   |    3       |       7        |   20

tabla          | total | con_action_type | sin_action_type
case_followups |  45   |       45        |        0        ✅
```

---

## 📱 Después: Cómo se ve en la app

### Antes ❌
```
Casos Activos
├─ AGUSTIN (Activo)         ← Puede iniciar
├─ FLORENCIA (Cerrado)      ← No puede
└─ TRINIDAD (Reportado)     ← ¿Puede? NO! Bug

Click "Iniciar" en Trinidad:
ERROR: RPC ignora porque status ≠ 'Activo'
Trinity sigue en "Reportado"
NO aparece en sidebar Seguimientos
```

### Después ✅
```
Casos Activos
├─ AGUSTIN (Activo)         ✅ Puede iniciar
├─ FLORENCIA (Cerrado)      
└─ TRINIDAD (Reportado)     ✅ Ahora PUEDE iniciar

Click "Iniciar" en Trinidad:
✅ RPC ejecuta exitosamente
✅ Status cambia a "En Seguimiento"
✅ Trinidad APARECE en sidebar Seguimientos
✅ Click en Trinidad → Botón "Cierre de caso" visible
✅ Registro de acciones SIN error 400
```

---

## 📊 Validación

Después de ejecutar, verifica:

### ✅ stage_sla
```sql
SELECT stage_key, days_to_due FROM public.stage_sla ORDER BY stage_key;

-- Debes ver:
1. Comunicación/Denuncia | 1
2. Notificación Apoderados | 1
3. Recopilación Antecedentes | 3      ← AHORA tiene valor
4. Entrevistas | 5                     ← AHORA tiene valor
5. Investigación/Análisis | 10
6. Resolución y Sanciones | 1
7. Apelación/Recursos | 2
```

### ✅ RPC actualizado
```sql
-- El RPC debe estar en "En Seguimiento" en la condición
-- Comprueba en Supabase → SQL Editor → Stored Procedures → start_due_process
-- Debe tener: status in ('Reportado', 'Activo')
```

### ✅ case_followups
```sql
SELECT COUNT(*), COUNT(action_type) FROM public.case_followups;
-- Debe ser: 45 | 45 (todos tienen action_type)
```

---

## 🎯 Resultado final

**Tiempo estimado**: 5 minutos

**Después de completar**:
- ✅ Trinidad transiciona a "En Seguimiento"
- ✅ Aparece en sidebar Seguimientos
- ✅ Botón "Cierre de caso" funciona sin error 400
- ✅ Plazos calculados correctamente
- ✅ Sistema completamente funcional

---

## 📁 Referencia

| Archivo | Contenido |
|---------|-----------|
| `SOLUCION_COMPLETA_SUPABASE.sql` | SQL completo para ejecutar en Supabase |
| `ANALISIS_Y_SOLUCION_REAL.md` | Análisis detallado de cada problema |
| `src/api/db.js` | Frontend ya preparado ✅ |
| `RPC_START_DUE_PROCESS.sql` | RPC versión correcta ✅ |

---

## ⏰ Timeline

```
Ahora (2026-01-16)
├─ Análisis completado ✅
├─ SQL preparado ✅
├─ Frontend listo ✅
└─ ESPERANDO: Supabase online

Cuando Supabase online
├─ Ejecutar SQL en Supabase (5 min)
├─ Verificar resultados (2 min)
└─ SISTEMA FUNCIONAL 🎉
```

