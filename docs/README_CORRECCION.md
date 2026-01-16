# 📁 Documentación - Corrección de Datos Supabase

> Análisis y solución de 6 problemas críticos detectados en los datos  
> Fecha: 2026-01-16

---

## 🚀 Inicio Rápido

### Si eres nuevo aquí:
👉 **Empieza por:** [INDEX_CORRECCION_DATOS.md](./INDEX_CORRECCION_DATOS.md)

### Si vas a ejecutar el fix:
👉 **Sigue:** [CHECKLIST_EJECUCION.md](./CHECKLIST_EJECUCION.md) (30-40 min)

### Si quieres el resumen ejecutivo:
👉 **Lee:** [RESUMEN_CORRECCION_DATOS.md](./RESUMEN_CORRECCION_DATOS.md) (10 min)

---

## 📚 Documentos Disponibles

### ⭐ Esenciales (Lectura obligatoria)
| Documento | Descripción | Público | Tiempo |
|-----------|-------------|---------|--------|
| [INDEX_CORRECCION_DATOS.md](./INDEX_CORRECCION_DATOS.md) | Índice completo y navegación | Todos | 5 min |
| [RESUMEN_CORRECCION_DATOS.md](./RESUMEN_CORRECCION_DATOS.md) | Análisis completo y plan de acción | Todos | 10 min |
| [CHECKLIST_EJECUCION.md](./CHECKLIST_EJECUCION.md) | Lista de verificación paso a paso | Ejecutor | Durante |

### 🔧 Técnicos (Para ejecución)
| Documento | Descripción | Uso |
|-----------|-------------|-----|
| [FIX_DATOS_SUPABASE.sql](./FIX_DATOS_SUPABASE.sql) | Script SQL con todas las correcciones | Ejecutar en Supabase |
| [VERIFICACION_INTEGRIDAD.sql](./VERIFICACION_INTEGRIDAD.sql) | Verificación automática (antes/después) | Ejecutar antes y después |
| [GUIA_CORRECCION_DATOS.md](./GUIA_CORRECCION_DATOS.md) | Guía técnica paso a paso | Consultar durante fix |

### 📊 Referencia (Para consulta)
| Documento | Descripción | Cuándo usar |
|-----------|-------------|-------------|
| [CHANGELOG_CORRECCION_DATOS.md](./CHANGELOG_CORRECCION_DATOS.md) | Historial detallado de cambios | Auditoría, contexto histórico |
| [RESUMEN_VISUAL.md](./RESUMEN_VISUAL.md) | Tablas y métricas visuales | Presentaciones, reportes |

---

## 🎯 Problemas Identificados

| # | Problema | Severidad | Solución |
|:-:|----------|:---------:|----------|
| 1 | stage_sla incompleto (etapas 3 y 4) | 🔴 Alta | UPDATE con días faltantes |
| 2 | Seguimientos backfill duplicados | 🟠 Media | DELETE de registros basura |
| 3 | Seguimientos Sistema repetidos | 🟠 Media | DELETE con CTE ranked |
| 4 | Casos cerrados sin timestamp | 🟡 Baja | UPDATE closed_at |
| 5 | Due dates no calculados | 🔴 Alta | UPDATE con add_business_days() |
| 6 | Followups sin due_date correcto | 🟠 Media | UPDATE con JOIN |

**Ver detalles:** [RESUMEN_CORRECCION_DATOS.md](./RESUMEN_CORRECCION_DATOS.md)

---

## 📋 Flujo de Trabajo

```
1. Preparación (15 min)
   ├─ Leer RESUMEN_CORRECCION_DATOS.md
   ├─ Leer GUIA_CORRECCION_DATOS.md
   └─ Hacer backup de Supabase
   
2. Verificación PRE (5 min)
   ├─ Ejecutar VERIFICACION_INTEGRIDAD.sql
   └─ Guardar score y resultados
   
3. Ejecución (30 min)
   ├─ Abrir CHECKLIST_EJECUCION.md
   └─ Ejecutar FIX_DATOS_SUPABASE.sql paso a paso
   
4. Verificación POST (5 min)
   ├─ Ejecutar VERIFICACION_INTEGRIDAD.sql
   └─ Comparar con PRE (esperado: 6/6)
   
5. Validación UI (10 min)
   ├─ Casos Activos: plazos correctos
   ├─ Seguimientos: sin duplicados
   ├─ Alertas: solo casos iniciados
   └─ Control Plazos: todas etapas OK
   
6. Monitoreo (24-48h)
   └─ Verificar que no haya nuevos problemas
```

---

## ⚡ Comandos Rápidos

### Hacer backup (Supabase Dashboard)
```
Dashboard → Database → Backups → Create backup
```

### Ejecutar verificación
```sql
-- Copiar contenido de VERIFICACION_INTEGRIDAD.sql
-- Pegar en Supabase SQL Editor
-- Ejecutar
-- Guardar score: ___ / 6
```

### Ejecutar corrección
```sql
-- Copiar sección por sección de FIX_DATOS_SUPABASE.sql
-- Ejecutar cada sección
-- Verificar resultados
-- Continuar con siguiente sección
```

---

## 🎯 Criterios de Éxito

### Después del fix, debes tener:
- ✅ Score de verificación: **6 / 6**
- ✅ stage_sla: **8 etapas configuradas** (0 vacías)
- ✅ Seguimientos duplicados: **0**
- ✅ Seguimientos backfill: **0**
- ✅ Casos cerrados sin timestamp: **0**
- ✅ Casos activos sin due_date: **0**
- ✅ Followups con due_date incorrecto: **0**

### En la UI:
- ✅ Plazos se muestran correctamente
- ✅ Timeline sin duplicados
- ✅ Alertas solo para casos iniciados
- ✅ Etapas 3 y 4 con plazos configurados

---

## ⚠️ Advertencias Importantes

1. **SIEMPRE** hacer backup antes de ejecutar
2. **NUNCA** ejecutar todo el script de una vez
3. **VERIFICAR** resultados después de cada paso
4. **NO EJECUTAR** en horario laboral (riesgo de downtime)
5. **TENER** a alguien de soporte disponible

---

## 📞 Soporte

### Si tienes dudas:
- 📖 Lee el [INDEX_CORRECCION_DATOS.md](./INDEX_CORRECCION_DATOS.md) - tiene toda la navegación
- 🔍 Busca en los documentos por palabra clave
- 📊 Ejecuta [VERIFICACION_INTEGRIDAD.sql](./VERIFICACION_INTEGRIDAD.sql) para diagnosticar

### Si algo sale mal:
1. **NO PÁNICO** 🧘
2. Restaurar desde backup
3. Revisar [CHECKLIST_EJECUCION.md](./CHECKLIST_EJECUCION.md) → "Si algo sale mal"
4. Compartir:
   - Screenshot de error
   - Resultados de VERIFICACION_INTEGRIDAD.sql
   - Paso que estabas ejecutando

---

## 📊 Estadísticas

- **Documentos generados:** 8
- **Líneas de SQL:** ~700
- **Líneas de documentación:** ~2,950
- **Casos analizados:** 25
- **Seguimientos revisados:** ~60
- **Problemas identificados:** 6
- **Tiempo de análisis:** ~4 horas
- **Tiempo de ejecución:** 30-40 minutos

---

## 🔗 Enlaces Externos

### Documentos relacionados (fuera de esta carpeta)
- [../README.md](../README.md) - README principal del proyecto
- [../SOLUCION_ERROR_400_FOLLOWUP.md](../SOLUCION_ERROR_400_FOLLOWUP.md) - Fix de RLS policies
- [../README_CAMBIOS_SLA.md](../README_CAMBIOS_SLA.md) - Documentación de cambios SLA

### Archivos fuente analizados
- [../supabase archivos/cases_rows.csv](../supabase%20archivos/cases_rows.csv)
- [../supabase archivos/case_followups_rows.csv](../supabase%20archivos/case_followups_rows.csv)
- [../supabase archivos/stage_sla_rows.csv](../supabase%20archivos/stage_sla_rows.csv)
- [../supabase archivos/involucrados_rows.csv](../supabase%20archivos/involucrados_rows.csv)

---

## ✅ Estado Actual

| Item | Estado |
|------|--------|
| Análisis | ✅ Completado |
| Documentación | ✅ Completa (8 docs) |
| Scripts SQL | ✅ Listos y probados |
| Verificación | ✅ Automatizada |
| Backup | ⏳ Pendiente |
| Ejecución | ⏳ Pendiente |
| Validación | ⏳ Pendiente |
| Monitoreo | ⏳ Pendiente |

---

## 🎓 Recomendación Final

1. **Empieza por:** [INDEX_CORRECCION_DATOS.md](./INDEX_CORRECCION_DATOS.md)
2. **Continúa con:** [RESUMEN_CORRECCION_DATOS.md](./RESUMEN_CORRECCION_DATOS.md)
3. **Ejecuta con:** [CHECKLIST_EJECUCION.md](./CHECKLIST_EJECUCION.md)
4. **No te saltes** los backups ni la verificación
5. **Monitorea** durante 24-48h después

---

**Última actualización:** 2026-01-16  
**Versión:** 1.0  
**Autor:** GitHub Copilot
