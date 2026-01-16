# ✅ Checklist de Ejecución - Corrección de Datos

> **Tiempo estimado:** 30-40 minutos  
> **Ventana recomendada:** Fin de semana o fuera de horario laboral  
> **Requisitos:** Acceso a Supabase SQL Editor con permisos de admin

---

## 📋 Pre-ejecución (5 min)

- [ ] **Leer documentación completa**
  - [ ] [RESUMEN_CORRECCION_DATOS.md](./RESUMEN_CORRECCION_DATOS.md)
  - [ ] [GUIA_CORRECCION_DATOS.md](./GUIA_CORRECCION_DATOS.md)
  - [ ] [FIX_DATOS_SUPABASE.sql](./FIX_DATOS_SUPABASE.sql) (revisar comentarios)

- [ ] **Hacer backup de Supabase**
  - [ ] Dashboard → Database → Backups → Create backup
  - [ ] O exportar manualmente: `cases`, `case_followups`, `stage_sla`
  - [ ] Guardar timestamp del backup: `_______________`

- [ ] **Abrir archivos necesarios**
  - [ ] [VERIFICACION_INTEGRIDAD.sql](./VERIFICACION_INTEGRIDAD.sql) en nueva pestaña
  - [ ] [FIX_DATOS_SUPABASE.sql](./FIX_DATOS_SUPABASE.sql) en nueva pestaña
  - [ ] Documento de notas para registrar resultados

---

## 🔍 Verificación PRE-FIX (5 min)

- [ ] **Ejecutar script de verificación completo**
  ```sql
  -- Copiar todo el contenido de VERIFICACION_INTEGRIDAD.sql
  -- Pegar en Supabase SQL Editor
  -- Ejecutar
  ```

- [ ] **Guardar resultados**
  - [ ] Screenshot del "SCORE FINAL": `___ / 6 checks OK`
  - [ ] Anotar problemas encontrados:
    ```
    1. Stage SLA: ___ problemas
    2. Seguimientos duplicados: ___ problemas
    3. Seguimientos backfill: ___ problemas
    4. Casos cerrados sin timestamp: ___ problemas
    5. Casos activos sin due_date: ___ problemas
    6. Followups sin due_date correcto: ___ problemas
    ```

---

## 🔧 Ejecución del FIX (15-20 min)

### Paso 1: Arreglar stage_sla (1 min)
- [ ] **Ejecutar:**
  ```sql
  UPDATE public.stage_sla
  SET days_to_due = 3
  WHERE stage_key = '3. Recopilación Antecedentes'
    AND (days_to_due IS NULL OR days_to_due = 0);
  ```
  - [ ] Resultado: `___ filas actualizadas` (esperado: 1)

- [ ] **Ejecutar:**
  ```sql
  UPDATE public.stage_sla
  SET days_to_due = 5
  WHERE stage_key = '4. Entrevistas'
    AND (days_to_due IS NULL OR days_to_due = 0);
  ```
  - [ ] Resultado: `___ filas actualizadas` (esperado: 1)

- [ ] **Verificar:**
  ```sql
  SELECT stage_key, days_to_due FROM public.stage_sla ORDER BY stage_key;
  ```
  - [ ] ✅ Todas las etapas tienen `days_to_due` configurado

---

### Paso 2: Limpiar seguimientos de backfill (2 min)

**ELEGIR UNA OPCIÓN:**

- [ ] **OPCIÓN A (Recomendada): Eliminar todos**
  ```sql
  DELETE FROM public.case_followups
  WHERE responsible = 'Sistema'
    AND description LIKE '%backfill puntual%'
    AND action_type = 'Denuncia/Reporte';
  ```
  - [ ] Resultado: `___ filas eliminadas` (esperado: ~45)

- [ ] **OPCIÓN B (Conservadora): Mantener el más antiguo por caso**
  ```sql
  WITH ranked_followups AS (
    SELECT id, case_id, created_at,
      ROW_NUMBER() OVER (PARTITION BY case_id ORDER BY created_at ASC) as rn
    FROM public.case_followups
    WHERE responsible = 'Sistema'
      AND description LIKE '%backfill puntual%'
      AND action_type = 'Denuncia/Reporte'
  )
  DELETE FROM public.case_followups
  WHERE id IN (SELECT id FROM ranked_followups WHERE rn > 1);
  ```
  - [ ] Resultado: `___ filas eliminadas`

---

### Paso 3: Eliminar seguimientos Sistema duplicados (2 min)

- [ ] **Ver duplicados:**
  ```sql
  SELECT case_id, action_date, COUNT(*) as cantidad
  FROM public.case_followups
  WHERE responsible = 'Sistema'
    AND process_stage = '1. Comunicación/Denuncia'
  GROUP BY case_id, action_date
  HAVING COUNT(*) > 1;
  ```
  - [ ] Casos encontrados: `___`

- [ ] **Eliminar duplicados:**
  ```sql
  WITH ranked AS (
    SELECT id, case_id, action_date, created_at,
      ROW_NUMBER() OVER (
        PARTITION BY case_id, action_date, process_stage
        ORDER BY created_at DESC
      ) as rn
    FROM public.case_followups
    WHERE responsible = 'Sistema'
      AND process_stage = '1. Comunicación/Denuncia'
  )
  DELETE FROM public.case_followups
  WHERE id IN (SELECT id FROM ranked WHERE rn > 1);
  ```
  - [ ] Resultado: `___ filas eliminadas`

---

### Paso 4: Corregir casos cerrados sin timestamp (1 min)

- [ ] **Ver afectados:**
  ```sql
  SELECT id, status, closed_at, updated_at
  FROM public.cases
  WHERE status = 'Cerrado' AND closed_at IS NULL;
  ```
  - [ ] Casos encontrados: `___`

- [ ] **Corregir:**
  ```sql
  UPDATE public.cases
  SET closed_at = updated_at
  WHERE status = 'Cerrado' AND closed_at IS NULL;
  ```
  - [ ] Resultado: `___ filas actualizadas`

---

### Paso 5: Recalcular due_dates de casos (2 min)

- [ ] **Ver afectados:**
  ```sql
  SELECT id, seguimiento_started_at, indagacion_due_date, status
  FROM public.cases
  WHERE seguimiento_started_at IS NOT NULL
    AND indagacion_due_date IS NULL
    AND status != 'Cerrado';
  ```
  - [ ] Casos encontrados: `___`

- [ ] **Recalcular:**
  ```sql
  UPDATE public.cases c
  SET indagacion_due_date = (
    SELECT add_business_days(c.seguimiento_started_at::date, 10)
  )
  WHERE c.seguimiento_started_at IS NOT NULL
    AND c.indagacion_due_date IS NULL
    AND c.status != 'Cerrado';
  ```
  - [ ] Resultado: `___ filas actualizadas`

---

### Paso 6: Recalcular due_date de followups (2-3 min)

- [ ] **Ver afectados:**
  ```sql
  SELECT COUNT(*) as total
  FROM public.case_followups cf
  LEFT JOIN public.stage_sla s ON cf.process_stage = s.stage_key
  WHERE cf.process_stage IS NOT NULL
    AND s.days_to_due IS NOT NULL
    AND s.days_to_due > 0
    AND (cf.due_date IS NULL OR cf.due_date = cf.action_date);
  ```
  - [ ] Followups encontrados: `___`

- [ ] **Recalcular:**
  ```sql
  UPDATE public.case_followups cf
  SET due_date = add_business_days(cf.action_date, s.days_to_due)
  FROM public.stage_sla s
  WHERE cf.process_stage = s.stage_key
    AND s.days_to_due IS NOT NULL
    AND s.days_to_due > 0
    AND (cf.due_date IS NULL OR cf.due_date = cf.action_date);
  ```
  - [ ] Resultado: `___ filas actualizadas`

---

## ✅ Verificación POST-FIX (5 min)

- [ ] **Ejecutar script de verificación completo nuevamente**
  ```sql
  -- Copiar todo el contenido de VERIFICACION_INTEGRIDAD.sql
  -- Pegar en Supabase SQL Editor
  -- Ejecutar
  ```

- [ ] **Comparar resultados**
  - [ ] Screenshot del "SCORE FINAL": `___ / 6 checks OK` (esperado: 6/6)
  - [ ] Anotar problemas restantes:
    ```
    1. Stage SLA: ___ problemas (esperado: 0)
    2. Seguimientos duplicados: ___ problemas (esperado: 0)
    3. Seguimientos backfill: ___ problemas (esperado: 0)
    4. Casos cerrados sin timestamp: ___ problemas (esperado: 0)
    5. Casos activos sin due_date: ___ problemas (esperado: 0)
    6. Followups sin due_date correcto: ___ problemas (esperado: 0)
    ```

- [ ] **¿Score = 6/6?**
  - [ ] ✅ SÍ → Continuar con validación en UI
  - [ ] ❌ NO → Revisar sección específica que falló, ejecutar queries de diagnóstico

---

## 🖥️ Validación en UI (10 min)

### Casos Activos
- [ ] Abrir aplicación → Casos Activos
- [ ] Seleccionar un caso **sin iniciar** (seguimiento_started_at = NULL)
  - [ ] ✅ NO muestra badge de plazo
  - [ ] ✅ Botón dice "Iniciar debido proceso"
- [ ] Seleccionar un caso **con proceso iniciado**
  - [ ] ✅ Muestra "Vence en X días" o "Vencido X días"
  - [ ] ✅ Botón dice "Ver seguimiento"

### Seguimientos
- [ ] Abrir Seguimientos de un caso con proceso iniciado
- [ ] Revisar accordion "Acciones del Debido Proceso"
  - [ ] ✅ NO hay seguimientos duplicados "Inicio automático"
  - [ ] ✅ Timeline ordenado cronológicamente
  - [ ] ✅ Plazos por etapa se muestran correctamente
- [ ] Expandir todas las etapas
  - [ ] ✅ Etapa 3 (Recopilación) muestra "3 días"
  - [ ] ✅ Etapa 4 (Entrevistas) muestra "5 días"

### Alertas
- [ ] Abrir Alertas y Plazos
  - [ ] ✅ Solo aparecen casos con proceso iniciado
  - [ ] ✅ Casos cerrados NO aparecen
  - [ ] ✅ Días restantes son correctos (comparar con manual)
- [ ] Verificar colores:
  - [ ] 🔴 Vencidos (días < 0)
  - [ ] 🟠 Urgentes (días 1-3)
  - [ ] 🟡 Próximos (días 4-7)
  - [ ] ⚪ En plazo (días > 7)

### Control de Plazos
- [ ] Abrir Control de Plazos
- [ ] Seleccionar un caso
  - [ ] ✅ Todas las etapas muestran plazos (incluidas 3 y 4)
  - [ ] ✅ Colores de vencimiento correctos

### Dashboard
- [ ] Abrir Dashboard
- [ ] Revisar "Casos con plazos urgentes"
  - [ ] ✅ Solo casos con proceso iniciado
  - [ ] ✅ Plazos correctos

---

## 📊 Casos de Prueba Específicos

### Caso 1: `0e30bf52-d2f6-4789-a463-c24c9e25892e`
- [ ] **Antes:** Tenía 3 seguimientos duplicados del Sistema
- [ ] **Verificar:** Timeline limpio, sin duplicados
- [ ] **Estado:** ✅ / ❌

### Caso 2: `1fde4422-88f9-4668-a8e6-dcc4d16440c6`
- [ ] **Estado:** Reportado (activo)
- [ ] **Proceso iniciado:** 2026-01-15
- [ ] **Verificar:** Aparece en Alertas con plazo correcto
- [ ] **Estado:** ✅ / ❌

### Cualquier caso cerrado
- [ ] Buscar en base de datos:
  ```sql
  SELECT id, status, closed_at
  FROM public.cases
  WHERE status = 'Cerrado'
  LIMIT 3;
  ```
- [ ] **Verificar:** Todos tienen `closed_at` con timestamp
- [ ] **Verificar:** NO aparecen en Alertas
- [ ] **Estado:** ✅ / ❌

---

## 📝 Post-ejecución (2 min)

- [ ] **Documentar resultados**
  - [ ] Score PRE-FIX: `___/6`
  - [ ] Score POST-FIX: `___/6`
  - [ ] Filas actualizadas total: `___`
  - [ ] Filas eliminadas total: `___`
  - [ ] Tiempo de ejecución: `___` minutos
  - [ ] Problemas encontrados: `_______________`

- [ ] **Notificar a equipo**
  - [ ] Enviar resumen de cambios
  - [ ] Fecha/hora del fix: `_______________`
  - [ ] Estado final: ✅ Exitoso / ⚠️ Con advertencias / ❌ Falló

- [ ] **Programar monitoreo**
  - [ ] Revisar logs en 24h
  - [ ] Revisar logs en 48h
  - [ ] Verificar que no haya nuevos duplicados

---

## 🚨 Si algo sale mal

### ❌ Score POST-FIX < 6/6
1. Ejecutar query de diagnóstico de la sección específica que falló
2. Revisar [GUIA_CORRECCION_DATOS.md](./GUIA_CORRECCION_DATOS.md) paso a paso
3. Verificar que add_business_days() funciona correctamente
4. Consultar logs de Supabase

### ❌ Errores en queries
1. Copiar mensaje de error completo
2. Verificar sintaxis SQL
3. Verificar permisos de usuario
4. Revisar que las tablas existen

### ❌ UI muestra datos incorrectos
1. Verificar que el frontend está actualizado (F5)
2. Ejecutar VERIFICACION_INTEGRIDAD.sql para validar datos
3. Revisar consola del navegador para errores JavaScript
4. Limpiar cache del navegador

### 🆘 Necesitas restaurar
1. Ir a Supabase Dashboard → Database → Backups
2. Seleccionar el backup creado antes del fix
3. Restaurar
4. Verificar que los datos volvieron al estado original
5. Revisar qué salió mal antes de reintentar

---

## 📞 Contacto

**Si necesitas ayuda:**
- 📖 Revisar [GUIA_CORRECCION_DATOS.md](./GUIA_CORRECCION_DATOS.md)
- 📊 Compartir resultados de VERIFICACION_INTEGRIDAD.sql
- 🐛 Reportar errores con screenshots y mensajes completos

---

**Última actualización:** 2026-01-16  
**Versión:** 1.0  
**Estado:** ✅ Listo para ejecución
