# ✅ Análisis replanteado: 3 problemas reales (no 4)

## 🔄 La aclaración que cambió todo

**Usuario**: "Etapa 3 y 4 corresponden a días de investigación se dejan ahí para que se muestre que deben realizar esas acciones, con esa consideración replantea las soluciones"

**Traducción**: Las etapas 3 y 4 sin `days_to_due` es INTENCIONAL.

---

## 📊 Los problemas REALES (replanteado)

### ✅ NO ES PROBLEMA: stage_sla etapas 3 y 4 = NULL

**Archivo**: `supabase archivos/stage_sla_rows.csv`

```csv
stage_key                          | days_to_due
1. Comunicación/Denuncia          | 1
2. Notificación Apoderados        | 1
3. Recopilación Antecedentes      | NULL        ← INTENCIONAL
4. Entrevistas                    | NULL        ← INTENCIONAL
5. Investigación/Análisis         | 10
6. Resolución y Sanciones         | 1
7. Apelación/Recursos             | 2
```

**Significado**:
- Etapas con número (1,2,5,6,7): "Debes hacerlo en X días"
- Etapas sin número (3,4): "Debes hacerlo, pero sin plazo límite"

**Razón**:
- Recopilación de antecedentes: proceso flexible sin plazo individual
- Entrevistas: no puede tener fecha límite rígida

**⚠️ ACLARACIÓN IMPORTANTE**:
Aunque etapas 3 y 4 no tienen `days_to_due` individual, deben completarse dentro del marco de los **10 días totales de indagación** (Etapa 5 - Investigación/Análisis). El conjunto de etapas 3 → 4 → 5 no puede exceder 10 días.

**Conclusión**: ✅ CORRECTO - NO TOCAR (pero dentro del límite de 10 días totales)

---

### ❌ PROBLEMA 1: RPC ignora status='Reportado'

**Archivo**: Función PostgreSQL `start_due_process`

**Situación actual**:
```sql
status = case when c.status = 'Activo' then 'En Seguimiento' else c.status end
```

**El problema**:
- Trinity se crea con `status = 'Reportado'`
- RPC verifica: ¿status = 'Activo'? NO
- No actualiza, Trinity sigue en "Reportado"
- Usuario hace click, pero RPC no hace nada

**Impacto**:
- ❌ Trinity atrapado en "Reportado"
- ❌ No aparece en Seguimientos
- ❌ Usuario confundido

**Datos reales**:
```sql
-- Del archivo cases_rows.csv:
Trinity | status: Reportado | seguimiento_started_at: 2026-01-15 21:01:03
```

El caso existe y fue iniciado, pero el RPC ignora porque status ≠ 'Activo'

**Solución**:
```sql
status = case when c.status in ('Reportado', 'Activo') then 'En Seguimiento' else c.status end
```

---

### ❌ PROBLEMA 2: process_stage NULL en inserciones

**Archivo**: `case_followups_rows.csv` + Frontend `src/api/db.js`

**El problema**:
Frontend envía:
```javascript
{
  case_id: 'xyz',
  action_date: '2026-01-16',
  action_type: 'Seguimiento',
  process_stage: null  // ← ❌ NULL!
}
```

Supabase rechaza:
```
ERROR: null value in column "action_type" of relation "case_followups" 
violates not-null constraint
```

**Impacto**:
- ❌ ERROR 400 cuando registras acción
- ❌ Usuario no puede guardar seguimiento

**Solución**:
Asegurar que siempre tiene valor:
```sql
UPDATE public.case_followups
SET action_type = COALESCE(action_type, 'Seguimiento')
WHERE action_type IS NULL;
```

---

### ⚠️ PROBLEMA 3: due_dates inconsistentes (PARCIAL)

**Archivo**: `case_followups_rows.csv`

**Situación actual**:
```
ID          | action_date | process_stage      | due_date
abc123      | 2026-01-10  | 3. Recopilación    | 2026-01-10    ← NO CALCULADO
def456      | 2026-01-11  | 4. Entrevistas     | NULL          ← OK (sin plazo)
ghi789      | 2026-01-12  | 5. Investigación   | 2026-01-09    ← ❌ INVÁLIDO
```

**El problema (PARCIAL)**:
- Si etapa TIENE plazo y due_date = action_date → no se calculó
- Si etapa NO TIENE plazo y due_date = NULL → OK
- Si etapa TIENE plazo y due_date < action_date → inválido

**Impacto**:
- ⚠️ Algunos plazos incorrectos
- ⚠️ Pero no afecta etapas sin plazo (3,4)

**Solución**:
```sql
-- Recalcular SOLO para etapas con plazo (days_to_due > 0)
UPDATE public.case_followups cf
SET due_date = add_business_days(cf.action_date, s.days_to_due)
FROM public.stage_sla s
WHERE cf.process_stage = s.stage_key
  AND s.days_to_due IS NOT NULL AND s.days_to_due > 0
  AND (cf.due_date IS NULL OR cf.due_date = cf.action_date OR cf.due_date < cf.action_date);
```

**Importante**:
- Etapas 3 y 4 sin plazo → dejan due_date = NULL (correcto)
- Etapas 1,2,5,6,7 con plazo → recalculan correctamente

---

## 🎯 Comparación: Análisis inicial vs replanteado

### ANTES (INCORRECTO)
```
Problema 1: stage_sla etapas 3,4 NULL
  → "Hay que rellenarlas con 3 y 5 días"

Problema 2: RPC ignora 'Reportado'
  → "Agregar 'Reportado' a la condición"

Problema 3: process_stage NULL
  → "Asegurar valor por defecto"

Problema 4: due_dates inconsistentes
  → "Recalcularlos todos"

= 4 PROBLEMAS = 4 SOLUCIONES
```

### AHORA (CORRECTO)
```
CORRECTO: stage_sla etapas 3,4 NULL
  → ✅ No tocar, es intencional

Problema 1: RPC ignora 'Reportado'
  → "Agregar 'Reportado' a la condición"

Problema 2: process_stage NULL
  → "Asegurar valor por defecto"

Problema 3: due_dates inconsistentes (solo con plazo)
  → "Recalcularlos, pero solo etapas con plazo"

= 3 PROBLEMAS = 3 SOLUCIONES (+ 1 verificación)
```

---

## 📋 Checklist de soluciones

| # | Problema | Solución | Archivo SQL | Estado |
|---|----------|----------|-------------|--------|
| - | stage_sla 3,4 NULL | ✅ NO TOCAR | N/A | ✅ CORRECTO |
| 1 | RPC 'Reportado' | Cambiar condición | SOLUCION_REPLANTEADA.sql | ❌ PENDIENTE |
| 2 | action_type NULL | COALESCE | SOLUCION_REPLANTEADA.sql | ❌ PENDIENTE |
| 3 | due_dates inconsistentes | Recalcular (con plazo) | SOLUCION_REPLANTEADA.sql | ❌ PENDIENTE |

---

## ✅ Verificaciones post-ejecución

### Check 1: stage_sla intacto ✅
```sql
SELECT * FROM public.stage_sla ORDER BY stage_key;
-- ESPERADO: 3 y 4 siguen con NULL
```

### Check 2: RPC actualizado ✅
```
Ir a: Supabase → Stored Procedures → start_due_process
Buscar: status in ('Reportado', 'Activo')
ESPERADO: Encontrarlo ✅
```

### Check 3: action_type sin NULL ✅
```sql
SELECT COUNT(CASE WHEN action_type IS NULL THEN 1 END) FROM public.case_followups;
-- ESPERADO: 0
```

### Check 4: due_dates válidas (etapas con plazo) ✅
```sql
SELECT COUNT(CASE WHEN due_date < action_date THEN 1 END) FROM public.case_followups;
-- ESPERADO: 0 o muy pocos (solo etapas sin plazo)
```

---

## 🚀 Impacto final

### ANTES ❌
```
Trinity (Reportado)
  → Etapas 3,4 sin plazo: correcto
  → RPC ignora 'Reportado': ❌ PROBLEMA
  → ERROR 400 al registrar: ❌ PROBLEMA
  → Plazos inconsistentes: ❌ PROBLEMA
  → RESULTADO: SISTEMA ROTO
```

### DESPUÉS ✅
```
Trinity (Reportado)
  → Click "Iniciar debido proceso"
  → RPC ahora maneja 'Reportado': ✅
  → Transiciona a "En Seguimiento": ✅
  → Aparece en Seguimientos: ✅
  → Sin ERROR 400: ✅
  → Plazos correctos: ✅
  → Etapas 3,4 sin plazo funcionan bien: ✅
  → RESULTADO: SISTEMA FUNCIONAL
```

---

## 📊 Números

| Métrica | Antes | Después |
|---------|-------|---------|
| Problemas | 4 | 3 |
| Cambios en BD | 4 soluciones | 3 soluciones |
| stage_sla modificadas | 2 filas | 0 filas (no tocar) |
| RPC actualizado | Sí | Sí |
| action_type NULL | Sí | No (0) |
| due_dates válidas | No (múltiples) | Sí (válidas) |
| Riesgo de cambios | Mayor | Menor |
| Funcionalidad | ❌ | ✅ |

---

## 📚 Recursos

- **Análisis replanteado**: `REPLANTEO_SOLUCION.md` (este archivo)
- **SQL para ejecutar**: `SOLUCION_REPLANTEADA.sql`
- **Pasos a seguir**: `PASOS_EJECUTAR_SOLUCION.md` (sin cambios)
- **Verificación**: `CHECKLIST_VERIFICACION.md` (actualizar checks 1 y 5)

---

## 🎯 Conclusión

**Cambio principal**:
- NO modificar `stage_sla` porque etapas 3 y 4 sin plazo es INTENCIONAL
- Solo 3 problemas reales en lugar de 4
- Menor cantidad de cambios en BD = menor riesgo

**Resultado esperado**: Igual de funcional, pero más seguro.

