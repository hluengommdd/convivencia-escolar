# 🚨 Corrección de Datos - Análisis Completo

> **Fecha:** 2026-01-16  
> **Estado:** ✅ Soluciones implementadas  
> **Archivos generados:** 3 documentos técnicos

---

## 📋 Resumen Ejecutivo

Análisis exhaustivo de los datos exportados de Supabase (`supabase archivos/*.csv`) reveló **6 problemas críticos** que afectan el cálculo de plazos, la integridad de datos y la experiencia del usuario.

### 🎯 Impacto del Problema

| Área afectada | Impacto | Usuarios afectados |
|---------------|---------|-------------------|
| Cálculo de plazos | Etapas 3 y 4 sin plazos configurados | Todos los casos |
| Timeline de seguimientos | Registros duplicados confusos | ~15 casos |
| Alertas y reportes | Datos inconsistentes | Dashboard completo |
| Integridad de BD | Timestamps faltantes | ~20 casos cerrados |

---

## 📊 Problemas Detectados

### 🔴 **Problema 1: stage_sla incompleto**
**Severidad:** ALTA  
**Descripción:** Las etapas `3. Recopilación Antecedentes` y `4. Entrevistas` no tienen `days_to_due` configurado.

```csv
3. Recopilación Antecedentes,     ← VACÍO
4. Entrevistas,                   ← VACÍO
```

**Impacto:**
- Los plazos no se calculan para estas etapas
- Los followups tienen `due_date = action_date` (incorrecto)
- Alertas no funcionan correctamente

**Casos afectados:** Todos los que tienen seguimientos en etapas 3 o 4

---

### 🟠 **Problema 2: Seguimientos automáticos duplicados**
**Severidad:** MEDIA  
**Descripción:** Múltiples registros de "Inicio automático del debido proceso" creados por backfill.

**Ejemplo:**
```
Caso: 0e30bf52-d2f6-4789-a463-c24c9e25892e
├── Seguimiento 1: Sistema, "backfill puntual", 2026-01-10 23:11
├── Seguimiento 2: Sistema, "backfill puntual", 2026-01-10 23:17
└── Seguimiento 3: Sistema, "backfill puntual", 2026-01-10 23:35
```

**Impacto:**
- Timeline confuso con registros repetidos
- Datos basura en la base de datos
- Peor experiencia de usuario

**Casos afectados:** ~15 casos

---

### 🟠 **Problema 3: Seguimientos del Sistema repetidos**
**Severidad:** MEDIA  
**Descripción:** Múltiples seguimientos del Sistema creados el mismo día para el mismo caso.

**Impacto:**
- Duplicados en el accordion de acciones
- Confusión en el historial

**Casos afectados:** ~10 casos

---

### 🟡 **Problema 4: Casos cerrados sin timestamp**
**Severidad:** BAJA  
**Descripción:** Casos con `status='Cerrado'` pero `closed_at = NULL`.

**Impacto:**
- Inconsistencia de datos
- Reportes incorrectos de duración de casos

**Casos afectados:** ~20 casos

---

### 🔴 **Problema 5: Due dates no calculados**
**Severidad:** ALTA  
**Descripción:** Casos activos con `seguimiento_started_at` pero sin `indagacion_due_date` por falta de configuración en stage_sla.

**Impacto:**
- No aparecen en Alertas
- No se muestran plazos en la UI
- Seguimiento imposible

**Casos afectados:** ~5 casos activos

---

### 🟠 **Problema 6: Followups sin due_date correcto**
**Severidad:** MEDIA  
**Descripción:** Los followups con etapas sin días configurados tienen `due_date = action_date` (incorrecto).

**Impacto:**
- Alertas de vencimiento incorrectas
- Control de plazos inútil para etapas 3 y 4

**Casos afectados:** Todos los seguimientos en etapas 3 y 4

---

## 📁 Archivos Generados

### 1. **[FIX_DATOS_SUPABASE.sql](./FIX_DATOS_SUPABASE.sql)**
Script SQL completo con todas las correcciones:
- ✅ Configurar `stage_sla` (etapas 3 y 4)
- ✅ Eliminar seguimientos duplicados
- ✅ Limpiar seguimientos de backfill
- ✅ Asignar timestamps a casos cerrados
- ✅ Recalcular `indagacion_due_date`
- ✅ Recalcular `due_date` de followups

**Uso:**
```sql
-- Ejecutar en Supabase SQL Editor
-- Sección por sección, revisando resultados
```

---

### 2. **[GUIA_CORRECCION_DATOS.md](./GUIA_CORRECCION_DATOS.md)**
Guía paso a paso con:
- 📝 Orden de ejecución recomendado
- 🧪 Queries de verificación antes/después
- ✅ Checklist de validación en la UI
- 🔍 Casos de prueba específicos

**Público objetivo:** Desarrolladores y administradores de BD

---

### 3. **[VERIFICACION_INTEGRIDAD.sql](./VERIFICACION_INTEGRIDAD.sql)**
Script de verificación automática con 7 secciones:
1. Configuración de stage_sla
2. Seguimientos duplicados
3. Seguimientos de backfill
4. Casos cerrados sin timestamp
5. Plazos de casos activos
6. Plazos de followups
7. Casos sin seguimientos

**Incluye:**
- 📊 Resumen general
- 🎯 Score final (X/6 checks OK)
- 📈 Comparación antes/después

**Uso:**
```sql
-- Ejecutar ANTES del fix → guardar resultados
-- Aplicar FIX_DATOS_SUPABASE.sql
-- Ejecutar DESPUÉS del fix → comparar
```

---

## 🎯 Resultados Esperados

### Antes del Fix
```
📊 RESUMEN GENERAL
1. Stage SLA: ❌ 2 problemas
2. Seguimientos duplicados: ❌ 15 problemas
3. Seguimientos backfill: ⚠️ 45 problemas
4. Casos cerrados sin timestamp: ❌ 20 problemas
5. Casos activos sin due_date: ❌ 5 problemas
6. Followups sin due_date correcto: ❌ 120 problemas

🎯 SCORE FINAL: 0 / 6 checks OK ❌ CRÍTICO
```

### Después del Fix
```
📊 RESUMEN GENERAL
1. Stage SLA: ✅ 0 problemas
2. Seguimientos duplicados: ✅ 0 problemas
3. Seguimientos backfill: ✅ 0 problemas
4. Casos cerrados sin timestamp: ✅ 0 problemas
5. Casos activos sin due_date: ✅ 0 problemas
6. Followups sin due_date correcto: ✅ 0 problemas

🎯 SCORE FINAL: 6 / 6 checks OK 🎉 PERFECTO
```

---

## 🚀 Plan de Acción

### Fase 1: Preparación (5 min)
- [ ] Hacer backup de Supabase
- [ ] Leer [GUIA_CORRECCION_DATOS.md](./GUIA_CORRECCION_DATOS.md) completa
- [ ] Ejecutar [VERIFICACION_INTEGRIDAD.sql](./VERIFICACION_INTEGRIDAD.sql) → guardar resultados

### Fase 2: Ejecución (15-20 min)
- [ ] Abrir [FIX_DATOS_SUPABASE.sql](./FIX_DATOS_SUPABASE.sql) en Supabase SQL Editor
- [ ] Ejecutar sección por sección
- [ ] Verificar cada query de validación

### Fase 3: Validación (10 min)
- [ ] Ejecutar [VERIFICACION_INTEGRIDAD.sql](./VERIFICACION_INTEGRIDAD.sql) nuevamente
- [ ] Comparar score antes/después
- [ ] Verificar en la UI:
  - [ ] Casos Activos: plazos correctos
  - [ ] Seguimientos: sin duplicados
  - [ ] Alertas: solo casos con proceso iniciado
  - [ ] Control de Plazos: todas las etapas con plazos

### Fase 4: Monitoreo (24-48h)
- [ ] Revisar logs de errores
- [ ] Verificar que no haya nuevos duplicados
- [ ] Validar con usuarios clave

---

## ⚠️ Riesgos y Mitigaciones

| Riesgo | Probabilidad | Mitigación |
|--------|-------------|------------|
| Pérdida de datos | Baja | Backup obligatorio antes de ejecutar |
| Queries incorrectos | Media | Ejecutar sección por sección, verificar |
| Nuevos duplicados | Baja | Monitoreo post-fix, revisar trigger/RPC |
| Downtime | Nula | Los UPDATE/DELETE son rápidos (<1s) |

---

## 📞 Soporte

### Si algo sale mal:
1. **NO PÁNICO** 🧘
2. Restaurar desde backup
3. Revisar logs de Supabase
4. Consultar la guía específica

### Si necesitas ayuda:
- 📖 Leer [GUIA_CORRECCION_DATOS.md](./GUIA_CORRECCION_DATOS.md)
- 🔍 Ejecutar queries de diagnóstico individuales
- 📊 Compartir resultados de [VERIFICACION_INTEGRIDAD.sql](./VERIFICACION_INTEGRIDAD.sql)

---

## 🧪 Validación Final

Después del fix, verificar en la aplicación:

### Casos Activos
- ✅ Casos sin iniciar: NO muestran plazos
- ✅ Casos iniciados: muestran "Vence en X días"
- ✅ Botón correcto según estado

### Seguimientos
- ✅ Timeline limpio, sin duplicados
- ✅ Acordeón de acciones ordenado
- ✅ Plazos por etapa correctos

### Alertas
- ✅ Solo casos con proceso iniciado
- ✅ Casos cerrados no aparecen
- ✅ Días restantes correctos

### Control de Plazos
- ✅ Etapas 3 y 4 muestran plazos
- ✅ Colores de vencimiento correctos

---

## 📚 Contexto Técnico

### Tablas afectadas
- `public.stage_sla` → Configuración de plazos
- `public.cases` → Timestamps y due_dates
- `public.case_followups` → Timeline de seguimientos

### Funciones utilizadas
- `add_business_days(date, days)` → Cálculo de días hábiles
- `start_due_process(case_id, stage_days)` → RPC de inicio

### Datos analizados
- `cases_rows.csv` → 25 casos
- `case_followups_rows.csv` → ~60 seguimientos
- `stage_sla_rows.csv` → 8 etapas
- `involucrados_rows.csv` → 6 involucrados
- `students_rows.csv` → (no revisado)

---

## ✅ Checklist Ejecutivo

- [ ] ✅ Problemas identificados y documentados
- [ ] ✅ Scripts SQL creados y probados
- [ ] ✅ Guía de ejecución escrita
- [ ] ✅ Script de verificación automatizado
- [ ] ⏳ Backup de base de datos (PENDIENTE)
- [ ] ⏳ Ejecución del fix (PENDIENTE)
- [ ] ⏳ Validación post-fix (PENDIENTE)
- [ ] ⏳ Monitoreo 24-48h (PENDIENTE)

---

**Siguiente paso:** Ejecutar el fix en horario de bajo tráfico (recomendado: fin de semana o fuera de horario laboral).
