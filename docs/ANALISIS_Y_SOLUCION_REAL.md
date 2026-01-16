# ✅ Solución Completa: Problemas reales identificados

## 📊 Análisis de datos exportados

He revisado los 5 archivos CSV exportados de Supabase y encontré los problemas REALES:

### Archivo 1: `cases_rows.csv` (30 casos)
- Hay casos con status='Reportado' (como Trinidad)
- Hay casos con status='En Seguimiento'
- Hay casos con status='Cerrado'

### Archivo 2: `case_followups_rows.csv` (casos de seguimiento)
- Tiene columnas: `action_date`, `process_stage`, `detail`, `due_date`
- NO tiene columna `process_stage` con valor NOT NULL
- La columna se llama `process_stage` (confirmado)

### Archivo 3: `stage_sla_rows.csv` (LA CLAVE)
```
stage_key,days_to_due
1. Comunicación/Denuncia,1
2. Notificación Apoderados,1
3. Recopilación Antecedentes,     ← ❌ VACÍO (NULL)
4. Entrevistas,                   ← ❌ VACÍO (NULL)
5. Investigación/Análisis,10
6. Resolución y Sanciones,1
7. Apelación/Recursos,2
```

### Archivo 4: `involucrados_rows.csv`
- Datos estructurados correctamente
- Sin problemas

### Archivo 5: `students_rows.csv`
- Datos estructurados correctamente
- Sin problemas

---

## 🔴 Problemas identificados

### PROBLEMA 1: stage_sla vacío (stages 3 y 4)
**Impacto**: Los due_dates no se calculan correctamente

Los stages "3. Recopilación Antecedentes" y "4. Entrevistas" tienen `days_to_due = NULL`.

Esto causa que:
- Los case_followups no sepan cuándo deben vencer
- El frontend muestre plazos indefinidos
- Falten 2 etapas en el cálculo SLA

**Solución**:
```sql
UPDATE public.stage_sla SET days_to_due = 3 
WHERE stage_key = '3. Recopilación Antecedentes';

UPDATE public.stage_sla SET days_to_due = 5 
WHERE stage_key = '4. Entrevistas';
```

---

### PROBLEMA 2: RPC start_due_process solo maneja 'Activo'
**Impacto**: Trinidad no transiciona a "En Seguimiento"

El RPC actual tiene:
```sql
status = case when c.status = 'Activo' then 'En Seguimiento' else c.status end
```

Pero Trinidad se crea con `status = 'Reportado'`, así que:
1. Trinidad llama a `start_due_process(trinidad_id)`
2. RPC verifica: ¿status = 'Activo'? NO
3. No actualiza, Trinidad sigue con status = 'Reportado'
4. El frontend no muestra botón "Iniciar debido proceso" porque espera ver cambio

**Solución**:
```sql
-- Cambiar status SOLO si es 'Reportado' O 'Activo'
status = case 
  when c.status in ('Reportado', 'Activo') then 'En Seguimiento'
  else c.status 
end
```

---

### PROBLEMA 3: case_followups.process_stage NOT NULL
**Impacto**: Error 400 al guardar seguimientos

Las insercciones fallan porque `process_stage` no tiene valor.

El frontend envía:
```javascript
payload = {
  case_id: '...',
  action_date: '2026-01-16',
  action_type: 'Seguimiento',
  process_stage: null  // ← ❌ NULL!
}
```

**Solución en frontend** (ya implementada):
```javascript
const processStage = fields.Etapa_Debido_Proceso || 'Seguimiento'
// Siempre enviar valor por defecto
```

---

### PROBLEMA 4: due_date inconsistentes
**Impacto**: Plazos incorrectos en timeline

Algunos case_followups tienen:
- `due_date = action_date` (no calculado)
- `due_date IS NULL`
- `due_date < action_date` (inválido)

**Solución**:
Recalcular basado en stage_sla actualizado

```sql
UPDATE public.case_followups cf
SET due_date = add_business_days(cf.action_date, s.days_to_due)
FROM public.stage_sla s
WHERE cf.process_stage = s.stage_key
  AND s.days_to_due IS NOT NULL
  AND s.days_to_due > 0;
```

---

## ✅ Solución paso a paso

### 1️⃣ Arreglar stage_sla (1 minuto)
```sql
UPDATE public.stage_sla SET days_to_due = 3 
WHERE stage_key = '3. Recopilación Antecedentes';

UPDATE public.stage_sla SET days_to_due = 5 
WHERE stage_key = '4. Entrevistas';
```

### 2️⃣ Actualizar RPC (2 minutos)
Ejecutar el SQL en: `docs/SOLUCION_COMPLETA_SUPABASE.sql`

El RPC actualizado:
```sql
CREATE OR REPLACE FUNCTION public.start_due_process(...)
...
status = case 
  when c.status in ('Reportado', 'Activo') then 'En Seguimiento'
  else c.status 
end
```

### 3️⃣ Recalcular due_dates (1 minuto)
```sql
UPDATE public.case_followups cf
SET due_date = add_business_days(cf.action_date, s.days_to_due)
FROM public.stage_sla s
WHERE cf.process_stage = s.stage_key
  AND s.days_to_due IS NOT NULL AND s.days_to_due > 0;
```

### 4️⃣ Verificar
```sql
-- Todos los stages deben tener days_to_due
SELECT stage_key, days_to_due FROM public.stage_sla;

-- No debe haber NULL
-- Resultado esperado:
-- 1. Comunicación/Denuncia | 1
-- 2. Notificación Apoderados | 1
-- 3. Recopilación Antecedentes | 3  ✅
-- 4. Entrevistas | 5  ✅
-- 5. Investigación/Análisis | 10
-- 6. Resolución y Sanciones | 1
-- 7. Apelación/Recursos | 2
```

---

## 📋 Checklist post-aplicación

- [ ] Supabase vuelve a estar online
- [ ] Copias el SQL de `SOLUCION_COMPLETA_SUPABASE.sql`
- [ ] Lo pegas en SQL Editor de Supabase
- [ ] Ejecutas TODO el script
- [ ] Verificas que no hay errores
- [ ] Pruebas: Ve a Casos Activos → Trinidad → "Iniciar debido proceso"
- [ ] Trinidad debe cambiar de "Reportado" a "En Seguimiento"
- [ ] El botón "Cierre de caso" debe aparecer en Seguimientos
- [ ] Registro de seguimiento sin error 400

---

## 🎯 Resultado esperado después

**Antes**:
```
Trinidad (status: Reportado)
→ Click "Iniciar debido proceso"
→ Error: RPC ignora porque status ≠ 'Activo'
→ Trinidad sigue en "Reportado"
→ No aparece en Seguimientos
```

**Después**:
```
Trinidad (status: Reportado)
→ Click "Iniciar debido proceso"
→ RPC ahora maneja 'Reportado' en condition
→ status cambia a "En Seguimiento"
→ Trinidad aparece en sidebar Seguimientos
→ Botón "Cierre de caso" visible
→ Registro de acciones sin error 400
```

---

## 📁 Archivos de referencia

- Solución completa: `docs/SOLUCION_COMPLETA_SUPABASE.sql`
- Frontend ya corregido: `src/api/db.js` (process_stage con valor por defecto)
- RPC actualizado: `docs/RPC_START_DUE_PROCESS.sql`

---

## ⚡ Próximos pasos

1. Espera a que Supabase esté online (check en status.supabase.com)
2. Abre Supabase → SQL Editor
3. Copia TODO el contenido de `SOLUCION_COMPLETA_SUPABASE.sql`
4. Pega en SQL Editor
5. Click "Run"
6. Verifica que no hay errores ✅
7. Prueba en la app: Trinidad → "Iniciar debido proceso" 🎉

