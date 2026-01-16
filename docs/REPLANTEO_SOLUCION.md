# 🔄 REPLANTEO: Solución revisada

## El cambio de perspectiva

**Usuario aclaró**: Las etapas 3 y 4 están vacías **INTENCIONALMENTE** porque son etapas informativas sin plazo.

Esto cambia todo el análisis.

---

## ❌ LO QUE PENSÉ (INCORRECTO)

### Problema 1: stage_sla vacío
- Etapas 3 y 4 con `days_to_due = NULL`
- **Conclusión**: Es un ERROR
- **Solución**: Rellenar con 3 y 5 días

**PERO EL USUARIO DICE**: Es intencional, no es un error.

---

## ✅ LO CORRECTO (REPLANTEO)

### NO es un problema: stage_sla etapas 3 y 4 con NULL

**Justificación**:
- Etapa 1 (Comunicación/Denuncia): 1 día → plazo claro
- Etapa 2 (Notificación Apoderados): 1 día → plazo claro
- Etapa 3 (Recopilación Antecedentes): NULL → sin plazo, informativa
- Etapa 4 (Entrevistas): NULL → sin plazo, informativa
- Etapa 5 (Investigación/Análisis): 10 días → plazo claro
- Etapa 6 (Resolución y Sanciones): 1 día → plazo claro
- Etapa 7 (Apelación/Recursos): 2 días → plazo claro

**Significado**:
```
Etapas con plazo (1,2,5,6,7):
  "Debes hacer esto en X días"

Etapas sin plazo (3,4):
  "Debes hacer esto, pero sin límite de tiempo"
```

**Esto es CORRECTO porque**:
- Recopilación de antecedentes: puede tomar días o semanas sin prisa
- Entrevistas: proceso flexible que no puede tener fecha límite

**⚠️ ACLARACIÓN IMPORTANTE**:
Aunque etapas 3 y 4 no tienen un plazo específico (`days_to_due = NULL`), ambas deben completarse dentro del marco de los **10 días totales de la Etapa 5 (Investigación/Análisis)**. Es decir:
- Etapa 3 + Etapa 4 + Etapa 5 = 10 días máximo para todo el proceso de indagación
- Las etapas 3 y 4 son flexibles internamente, pero el conjunto debe terminar en 10 días

---

## 🔴 PROBLEMAS REALES (revisado: 3, no 4)

### Problema 1: RPC ignora 'Reportado' ❌
**SIGUE SIENDO PROBLEMA**

```sql
-- ACTUAL (INCORRECTO)
status = case when c.status = 'Activo' then 'En Seguimiento' else c.status end
                                ↑
                        Solo 'Activo'

-- DEBERÍA SER
status = case when c.status in ('Reportado', 'Activo') then 'En Seguimiento' else c.status end
                                ↑
                        Ambos estados
```

**Impacto**: Trinity creado con 'Reportado' nunca transiciona.

---

### Problema 2: process_stage NULL ❌
**SIGUE SIENDO PROBLEMA**

Frontend envía:
```javascript
{
  case_id: '...',
  action_type: 'Seguimiento',
  process_stage: null  // ← ❌ NOT NULL constraint
}
```

Resultado: ERROR 400

**Solución**: Asegurar `action_type` nunca sea NULL

---

### Problema 3: due_dates inconsistentes ⚠️
**PARCIALMENTE PROBLEMA**

```
due_date = action_date        ← No calculado (problema si hay plazo)
due_date = NULL               ← OK si no hay plazo (etapa 3,4)
due_date < action_date        ← INVÁLIDO (problema)
```

**Solución**: Recalcular SOLO para etapas con plazo definido

---

## 📊 Comparación: Antes vs después del replanteo

| Concepto | ANTES (pensé) | AHORA (correcto) |
|----------|---------------|-----------------| 
| stage_sla 3,4 NULL | ❌ ERROR | ✅ CORRECTO |
| RPC solo 'Activo' | ❌ PROBLEMA | ❌ PROBLEMA |
| process_stage NULL | ❌ PROBLEMA | ❌ PROBLEMA |
| due_dates inconsistentes | ❌ PROBLEMA | ⚠️ PARCIAL |
| Total problemas | 4 | 3 (+ 1 parcial) |

---

## 🎯 Soluciones actualizadas

### Solución 1: RPC start_due_process
```sql
-- DE:
status = case when c.status = 'Activo' then 'En Seguimiento' else c.status end

-- A:
status = case when c.status in ('Reportado', 'Activo') then 'En Seguimiento' else c.status end
```

**Trinity Impact**: Reportado → En Seguimiento ✅

---

### Solución 2: action_type NULL
```sql
UPDATE public.case_followups
SET action_type = COALESCE(action_type, 'Seguimiento')
WHERE action_type IS NULL;
```

**ERROR 400 Impact**: Eliminado ✅

---

### Solución 3: due_dates (solo etapas con plazo)
```sql
-- Recalcular SOLO donde days_to_due > 0
UPDATE public.case_followups cf
SET due_date = add_business_days(cf.action_date, s.days_to_due)
FROM public.stage_sla s
WHERE cf.process_stage = s.stage_key
  AND s.days_to_due IS NOT NULL
  AND s.days_to_due > 0
  AND (cf.due_date IS NULL OR cf.due_date = cf.action_date OR cf.due_date < cf.action_date);
```

**Plazos Impact**: Solo válidos para etapas con límite ✅

---

## ✅ Verificaciones post-ejecución

### Check 1: stage_sla es correcto
```
1. Comunicación/Denuncia       | 1     ✅
2. Notificación Apoderados     | 1     ✅
3. Recopilación Antecedentes   | NULL  ✅ (INTENCIONAL)
4. Entrevistas                 | NULL  ✅ (INTENCIONAL)
5. Investigación/Análisis      | 10    ✅
6. Resolución y Sanciones      | 1     ✅
7. Apelación/Recursos          | 2     ✅
```

### Check 2: RPC actualizado
- Debe contener: `status in ('Reportado', 'Activo')`

### Check 3: action_type sin NULL
```sql
SELECT COUNT(CASE WHEN action_type IS NULL THEN 1 END) FROM case_followups;
-- Debe mostrar: 0
```

### Check 4: due_dates válidos
```sql
SELECT COUNT(CASE WHEN due_date < action_date THEN 1 END) FROM case_followups;
-- Debe mostrar: 0 (o muy pocos)
```

---

## 🎯 Resultado esperado

### ANTES ❌
```
Trinity (Reportado)
  → Click "Iniciar"
  → RPC ignora porque status ≠ 'Activo'
  → Sigue "Reportado"
  → ERROR 400 al registrar
  → No aparece en Seguimientos
```

### DESPUÉS ✅
```
Trinity (Reportado)
  → Click "Iniciar"
  → RPC ahora maneja 'Reportado'
  → Transiciona a "En Seguimiento"
  → Sin ERROR 400
  → Aparece en Seguimientos
  → Botón "Cierre de caso" funciona
  → Etapas 3 y 4 informativas sin plazo
  → Plazos correctos para otras etapas
```

---

## 📝 Archivo para ejecutar

Ahora hay **DOS opciones**:

1. **`SOLUCION_REPLANTEADA.sql`** (NUEVO)
   - Con la aclaración de que stage_sla es correcto
   - No modifica etapas 3 y 4
   - Solo 3 soluciones reales

2. **`SOLUCION_COMPLETA_SUPABASE.sql`** (ANTERIOR)
   - Incluía cambio a stage_sla (innecesario)
   - Puedes ignorar

**RECOMENDACIÓN**: Usa `SOLUCION_REPLANTEADA.sql`

---

## 📊 Impacto de no tocar stage_sla

| Aspecto | Si modificamos (anterior) | Si NO modificamos (nuevo) |
|---------|---------------------------|------------------------|
| Trabajo | Más cambios en BD | Menos cambios |
| Seguridad | Mayor riesgo | Menor riesgo |
| Lógica | Forzamos plazos | Respetamos diseño |
| Resultado | Igual funcional | Igual funcional |

**Conclusión**: Es mejor NO tocar stage_sla si fue intencional.

---

## ✨ Resumen

**Cambio principal**: 
- NO modificar `stage_sla` etapas 3 y 4
- Solo 3 soluciones en lugar de 4
- El sistema ya está bien diseñado

**Los 3 problemas REALES**:
1. RPC → Agregar 'Reportado'
2. action_type → Asegurar no NULL
3. due_dates → Recalcular solo con plazo

**Tiempo de ejecución**: Mismo (~10 min)

**Complejidad**: Menor (menos cambios)

**Riesgo**: Menor (no tocamos configuración intencional)

