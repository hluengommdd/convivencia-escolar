# 🔧 Guía de Corrección de Datos - Convivencia Escolar

> **Fecha de creación:** 2026-01-16  
> **Archivo SQL:** [`FIX_DATOS_SUPABASE.sql`](./FIX_DATOS_SUPABASE.sql)

---

## 📋 Resumen de Problemas Detectados

Análisis realizado con base en los archivos CSV exportados de Supabase:

| # | Problema | Impacto | Severidad |
|---|----------|---------|-----------|
| 1 | **stage_sla incompleto** | Plazos no se calculan para etapas 3 y 4 | 🔴 Alta |
| 2 | **Seguimientos duplicados automáticos** | Timeline confuso con múltiples "Inicio automático" | 🟠 Media |
| 3 | **Seguimientos del Sistema repetidos** | Múltiples registros el mismo día | 🟠 Media |
| 4 | **Casos cerrados sin timestamp** | Inconsistencia de datos (closed_at = NULL) | 🟡 Baja |
| 5 | **Due dates no calculados** | Casos activos sin plazos por stage_sla vacío | 🔴 Alta |
| 6 | **Followups sin due_date correcto** | Plazos incorrectos en seguimientos | 🟠 Media |

---

## 🎯 Orden de Ejecución Recomendado

### ⚠️ ANTES DE COMENZAR

1. **Hacer backup de la base de datos**
   ```sql
   -- En Supabase Dashboard → Database → Backups
   -- O exportar las tablas manualmente
   ```

2. **Revisar el archivo SQL completo:**  
   👉 [docs/FIX_DATOS_SUPABASE.sql](./FIX_DATOS_SUPABASE.sql)

---

## 📝 Paso a Paso

### **Paso 1: Arreglar configuración de stage_sla** ✅

**Problema:**  
Las etapas `3. Recopilación Antecedentes` y `4. Entrevistas` no tienen `days_to_due` configurado.

**Solución:**
```sql
UPDATE public.stage_sla
SET days_to_due = 3
WHERE stage_key = '3. Recopilación Antecedentes'
  AND (days_to_due IS NULL OR days_to_due = 0);

UPDATE public.stage_sla
SET days_to_due = 5
WHERE stage_key = '4. Entrevistas'
  AND (days_to_due IS NULL OR days_to_due = 0);
```

**Verificar:**
```sql
SELECT stage_key, days_to_due 
FROM public.stage_sla 
ORDER BY stage_key;
```

---

### **Paso 2: Limpiar seguimientos automáticos duplicados** 🧹

**Problema:**  
Múltiples registros de "Inicio automático del debido proceso" creados por backfill.

**Ejemplo:**  
Caso `0e30bf52-d2f6-4789-a463-c24c9e25892e` tiene **3 seguimientos** del Sistema con la misma descripción.

**Solución (Opción A - Recomendada):**  
Eliminar TODOS los seguimientos de backfill automático:

```sql
DELETE FROM public.case_followups
WHERE responsible = 'Sistema'
  AND description LIKE '%backfill puntual%'
  AND action_type = 'Denuncia/Reporte';
```

**Solución (Opción B - Conservadora):**  
Mantener solo el más antiguo por caso:

```sql
WITH ranked_followups AS (
  SELECT 
    id,
    case_id,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY case_id 
      ORDER BY created_at ASC
    ) as rn
  FROM public.case_followups
  WHERE responsible = 'Sistema'
    AND description LIKE '%backfill puntual%'
    AND action_type = 'Denuncia/Reporte'
)
DELETE FROM public.case_followups
WHERE id IN (
  SELECT id 
  FROM ranked_followups 
  WHERE rn > 1
);
```

---

### **Paso 3: Eliminar seguimientos Sistema duplicados** 🔄

**Problema:**  
Múltiples seguimientos del Sistema creados el mismo día para el mismo caso.

**Ver duplicados:**
```sql
SELECT 
  case_id,
  action_date,
  COUNT(*) as cantidad
FROM public.case_followups
WHERE responsible = 'Sistema'
  AND process_stage = '1. Comunicación/Denuncia'
GROUP BY case_id, action_date
HAVING COUNT(*) > 1;
```

**Limpiar:**
```sql
WITH ranked AS (
  SELECT 
    id,
    case_id,
    action_date,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY case_id, action_date, process_stage
      ORDER BY created_at DESC
    ) as rn
  FROM public.case_followups
  WHERE responsible = 'Sistema'
    AND process_stage = '1. Comunicación/Denuncia'
)
DELETE FROM public.case_followups
WHERE id IN (
  SELECT id FROM ranked WHERE rn > 1
);
```

---

### **Paso 4: Corregir casos cerrados sin timestamp** 📅

**Problema:**  
Casos con `status='Cerrado'` pero `closed_at = NULL`.

**Ver afectados:**
```sql
SELECT id, status, closed_at, updated_at
FROM public.cases
WHERE status = 'Cerrado'
  AND closed_at IS NULL;
```

**Corregir:**
```sql
UPDATE public.cases
SET closed_at = updated_at
WHERE status = 'Cerrado'
  AND closed_at IS NULL;
```

---

### **Paso 5: Recalcular due_dates de casos** ⏱️

**Problema:**  
Casos con `seguimiento_started_at` pero sin `indagacion_due_date` por falta de configuración en stage_sla.

**Ver afectados:**
```sql
SELECT 
  id,
  seguimiento_started_at,
  indagacion_due_date,
  status
FROM public.cases
WHERE seguimiento_started_at IS NOT NULL
  AND indagacion_due_date IS NULL
  AND status != 'Cerrado';
```

**Recalcular:**
```sql
UPDATE public.cases c
SET indagacion_due_date = (
  SELECT add_business_days(c.seguimiento_started_at::date, 10)
)
WHERE c.seguimiento_started_at IS NOT NULL
  AND c.indagacion_due_date IS NULL
  AND c.status != 'Cerrado';
```

---

### **Paso 6: Recalcular due_date de followups** 📊

**Problema:**  
Los followups con etapas sin días configurados tienen `due_date = action_date` (incorrecto).

**Ver afectados:**
```sql
SELECT 
  cf.id,
  cf.case_id,
  cf.action_date,
  cf.process_stage,
  cf.due_date,
  s.days_to_due,
  CASE 
    WHEN s.days_to_due IS NULL THEN '❌ Stage sin días'
    WHEN cf.due_date = cf.action_date THEN '⚠️ Due = action (revisar)'
    ELSE '✅ OK'
  END as status
FROM public.case_followups cf
LEFT JOIN public.stage_sla s ON cf.process_stage = s.stage_key
WHERE cf.process_stage IS NOT NULL
  AND cf.action_date IS NOT NULL
ORDER BY cf.case_id, cf.action_date;
```

**Recalcular:**
```sql
UPDATE public.case_followups cf
SET due_date = add_business_days(cf.action_date, s.days_to_due)
FROM public.stage_sla s
WHERE cf.process_stage = s.stage_key
  AND s.days_to_due IS NOT NULL
  AND s.days_to_due > 0
  AND (
    cf.due_date IS NULL 
    OR cf.due_date = cf.action_date
  );
```

---

## ✅ Verificación Final

Ejecutar estos queries para confirmar que todo quedó correcto:

```sql
-- 1. Stage SLA completo
SELECT 'Stage SLA', COUNT(*) as total, COUNT(days_to_due) as con_dias
FROM public.stage_sla;

-- 2. Sin seguimientos duplicados
SELECT 'Seguimientos duplicados', COUNT(*) as total
FROM (
  SELECT case_id, action_date, process_stage, COUNT(*) as cnt
  FROM public.case_followups
  GROUP BY case_id, action_date, process_stage
  HAVING COUNT(*) > 1
) duplicados;

-- 3. Casos cerrados con timestamp
SELECT 'Casos cerrados sin timestamp', COUNT(*)
FROM public.cases
WHERE status = 'Cerrado' AND closed_at IS NULL;

-- 4. Casos activos con due_date
SELECT 
  'Casos activos' as tipo,
  COUNT(*) as total,
  COUNT(indagacion_due_date) as con_due_date,
  COUNT(*) - COUNT(indagacion_due_date) as sin_due_date
FROM public.cases
WHERE status != 'Cerrado'
  AND seguimiento_started_at IS NOT NULL;
```

**Resultado esperado:**
- ✅ Stage SLA: 8 etapas, todas con días
- ✅ Seguimientos duplicados: 0
- ✅ Casos cerrados sin timestamp: 0
- ✅ Casos activos: todos con due_date

---

## 🧪 Validación en la UI

Después de ejecutar los scripts SQL, verificar en la aplicación:

### **1. Casos Activos**
- [ ] Los casos sin iniciar NO muestran plazos
- [ ] Los casos iniciados muestran "Vence en X días" o "Vencido"
- [ ] No hay errores de cálculo de plazos

### **2. Seguimientos**
- [ ] No aparecen seguimientos duplicados "Inicio automático"
- [ ] El timeline muestra acciones únicas y ordenadas
- [ ] Los plazos por etapa se calculan correctamente

### **3. Alertas**
- [ ] Solo aparecen casos con proceso iniciado
- [ ] Los casos cerrados NO aparecen
- [ ] Los días restantes son correctos

### **4. Control de Plazos**
- [ ] Las etapas 3 y 4 muestran plazos (antes aparecían vacías)
- [ ] Los colores de vencimiento son correctos

---

## 🔍 Casos de Prueba Específicos

### **Caso 1: `0e30bf52-d2f6-4789-a463-c24c9e25892e`**
- **Antes:** 3 seguimientos del Sistema duplicados
- **Después:** 0 seguimientos automáticos (si usaste Opción A) o 1 solo (Opción B)

### **Caso 2: `1fde4422-88f9-4668-a8e6-dcc4d16440c6`**
- **Estado:** Reportado (activo)
- **Proceso:** Iniciado el 2026-01-15
- **Verificar:** Debe aparecer en Alertas con plazo "Vence en X días"

### **Caso 3: Cualquier caso cerrado**
- **Verificar:** Tiene `closed_at` con timestamp
- **Verificar:** NO aparece en Alertas

---

## 📚 Documentos Relacionados

- [`FIX_DATOS_SUPABASE.sql`](./FIX_DATOS_SUPABASE.sql) - Script SQL completo
- [`SOLUCION_ERROR_400_FOLLOWUP.md`](../SOLUCION_ERROR_400_FOLLOWUP.md) - Fix de RLS policies
- [`MIGRATIONS_RUNBOOK.md`](./MIGRATIONS_RUNBOOK.md) - Procedimiento de migraciones

---

## ⚠️ Notas Importantes

1. **Hacer backup** antes de ejecutar DELETE/UPDATE masivos
2. Ejecutar los queries de verificación **antes y después** de cada paso
3. Si algo sale mal, restaurar desde el backup
4. Los seguimientos automáticos de backfill son seguros de eliminar (Opción A)
5. Después de la corrección, monitorear la UI por 24-48 horas

---

## 🐛 Reportar Problemas

Si después de aplicar estos fixes encuentras problemas:

1. Exporta las tablas afectadas a CSV
2. Captura screenshots de la UI
3. Copia los mensajes de error de la consola
4. Documenta los pasos para reproducir

---

**¿Preguntas?** Revisa primero el archivo SQL completo. Contiene comentarios detallados y queries de diagnóstico.
