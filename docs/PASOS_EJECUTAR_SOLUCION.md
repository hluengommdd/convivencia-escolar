# ⚡ INSTRUCCIONES PASO A PASO: Ejecutar la solución

## 📋 Pre-requisitos

- [ ] Supabase está ONLINE (verifica en https://status.supabase.com/)
- [ ] Tienes acceso a tu proyecto Supabase
- [ ] Archivo listo: `docs/SOLUCION_COMPLETA_SUPABASE.sql`

---

## 🚀 PASO 1: Preparar el SQL

### Opción A: Copiar desde archivo
1. Abre: `/workspaces/convivencia-escolar/docs/SOLUCION_COMPLETA_SUPABASE.sql`
2. Selecciona TODO (Ctrl+A)
3. Copia (Ctrl+C)

### Opción B: Ver en terminal
```bash
cat /workspaces/convivencia-escolar/docs/SOLUCION_COMPLETA_SUPABASE.sql
```

---

## 🔐 PASO 2: Ir a Supabase

1. Ve a: https://app.supabase.com/
2. Login con tu cuenta
3. Selecciona tu PROYECTO
4. En el menú izquierdo, busca: **SQL Editor**
5. Click en SQL Editor

---

## 📝 PASO 3: Pegar el SQL

En el SQL Editor de Supabase:

1. Click en "New Query" (o deja limpio el area)
2. Pega TODO el contenido del SQL (Ctrl+V)
3. **NO ejecutes aún**

---

## 🔍 PASO 4: Revisar antes de ejecutar

Verifica que el SQL contenga:

```
[ ] -- SOLUCIÓN 1: Configurar stage_sla
[ ] UPDATE public.stage_sla SET days_to_due = 3 WHERE stage_key = '3. Recopilación Antecedentes';
[ ] UPDATE public.stage_sla SET days_to_due = 5 WHERE stage_key = '4. Entrevistas';

[ ] -- SOLUCIÓN 2: Actualizar RPC para manejar 'Reportado'
[ ] CREATE OR REPLACE FUNCTION public.start_due_process(...)
[ ] status = case when c.status in ('Reportado', 'Activo') then 'En Seguimiento'

[ ] -- SOLUCIÓN 3, 4, 5: Otras correcciones
```

Si todo está, continúa. Si NO está, repite PASO 3.

---

## ▶️ PASO 5: EJECUTAR

### IMPORTANTE: Lee antes de hacer click

Este script hará:
1. ✅ Actualizar 2 filas en `stage_sla`
2. ✅ Recrear 1 RPC (`start_due_process`)
3. ✅ Actualizar N filas en `case_followups`
4. ✅ Ejecutar queries de verificación (NO modifican datos)

**NO hay DELETE** ✅
**NO hay pérdida de datos** ✅
**Es REVERSIBLE** (si necesitas revertir, pide backup)

### Hacer el click
1. Click en botón azul **"Run"** (abajo derecha del editor)
2. O presiona: **Ctrl+Enter**

---

## ⏳ PASO 6: ESPERAR

La ejecución puede tardar:
- **Lanzar**: < 1 segundo
- **stage_sla UPDATE**: < 1 segundo
- **RPC CREATE**: 1-2 segundos
- **case_followups UPDATE**: 2-5 segundos
- **Verificaciones**: 1-3 segundos
- **TOTAL**: 5-10 segundos máximo

Verás en la parte inferior:

```
Ejecutando...
✅ Query executed successfully (XX seconds)
```

---

## ✅ PASO 7: REVISAR RESULTADOS

Cuando termine, verás en la salida:

### Sección 1: ¿stage_sla quedó correcto?
```
Resumen de correcciones
tabla     total  con_dias  sin_dias
stage_sla   7      7         0       ✅
```

Si ves `sin_dias = 0`, está CORRECTO ✅

### Sección 2: ¿Casos actualizado?
```
tabla      total  reportados  en_seguimiento  cerrados
cases        30       3            7            20
```

Debe mostrar al menos 1 en `reportados` (Trinidad) ✅

### Sección 3: ¿case_followups OK?
```
tabla            total  con_action_type  sin_action_type
case_followups     45        45               0           ✅
```

Si ves `sin_action_type = 0`, está CORRECTO ✅

### Sección 4: ¿due_dates OK?
```
check_name  total  con_due_date  validos  invalidos
due_dates     45       45          43         2       ⚠️
```

Algunos pueden tener pequeñas inconsistencias (normal), pero DEBE haber `con_due_date > 0` ✅

---

## 🎯 PASO 8: VALIDACIÓN FINAL

Abre el SQL Editor nuevamente y ejecuta esto:

```sql
-- Verificación 1: stage_sla completo
SELECT stage_key, days_to_due 
FROM public.stage_sla 
ORDER BY stage_key;

-- Debes ver 7 filas, TODAS con days_to_due > 0
-- Las críticas son:
-- 3. Recopilación Antecedentes | 3
-- 4. Entrevistas | 5
```

Si ves eso, ✅ **COMPLETADO**

---

## 🧪 PASO 9: PROBAR EN LA APP

Vuelve a la app: http://localhost:5173/

1. Ve a **Casos Activos**
2. Busca **TRINIDAD**
3. Click en TRINIDAD (panel derecho)
4. Click en botón **"Iniciar debido proceso"**

### Esperado:
- ✅ SIN error en consola
- ✅ Estado cambiar de "Reportado" a "En Seguimiento"
- ✅ Navega automáticamente a `/seguimientos/`
- ✅ Verás el botón **"Cierre de caso"** en rojo

### Problemas:
Si ves error en consola, verifica:
- [ ] Supabase está online
- [ ] El SQL ejecutó sin errores
- [ ] Recarga la página (F5)

---

## 🐛 PASO 10: Pruebas adicionales

### Test 1: Registrar acción
1. En Seguimientos, click **"+ Registrar acción"**
2. Llena los campos
3. Click **"Guardar"**

**Esperado**: ✅ Sin error 400

### Test 2: Cerrar caso
1. En Seguimientos, click **"Cierre de caso"**
2. Confirma
3. Caso debe ir a "Casos Cerrados"

**Esperado**: ✅ Sin error 400, caso cierra correctamente

### Test 3: Ver en sidebar
1. Ve a **Casos Activos**
2. Abre sidebar (si está colapsado)
3. Busca **"Seguimientos"** dropdown
4. ¿Ves Trinidad?

**Esperado**: ✅ Trinidad aparece en la lista

---

## 📞 Si hay problemas

### Error: "Permission denied"
- [ ] Verifica que tienes permisos en Supabase
- [ ] Supabase puede estar fuera de línea aún
- [ ] Intenta en unos minutos

### Error: "Cannot find column 'stage_status'"
- [ ] El nombre de la columna es `process_stage`, NO `stage_status`
- [ ] Verifica que copiaste el SQL correcto

### Error: "Function start_due_process does not exist"
- [ ] La función debe existir pero estar mal
- [ ] Intenta ejecutar TODO el script de nuevo

### Trinidad sigue en "Reportado"
- [ ] [ ] Recarga la página (F5)
- [ ] [ ] Verifica que el RPC ejecutó
- [ ] [ ] Ve a Casos Cerrados y vuelve a Activos

---

## ✨ Resultado

Cuando todo esté hecho:

```
✅ stage_sla con días completos (3 y 4 etapas llenan)
✅ RPC maneja 'Reportado' y 'Activo'
✅ Trinidad transiciona a "En Seguimiento"
✅ Aparece en sidebar Seguimientos
✅ Botón "Cierre de caso" funciona
✅ Registro de acciones sin error 400
✅ Sistema completamente funcional 🎉
```

---

## 📊 Resumen

| Paso | Acción | Tiempo |
|------|--------|--------|
| 1 | Preparar SQL | 1 min |
| 2 | Ir a Supabase | 1 min |
| 3 | Pegar SQL | 1 min |
| 4 | Revisar | 1 min |
| 5-6 | Ejecutar y esperar | 1 min |
| 7 | Revisar resultados | 1 min |
| 8 | Validar | 1 min |
| 9 | Probar en app | 2 min |
| **TOTAL** | | **~10 min** |

---

## 🆘 Contacto

Si algo no funciona:
1. Revisa los logs en Supabase (SQL Editor → últimas queries)
2. Verifica status.supabase.com
3. Copia el error exacto
4. Intenta ejecutar solo la sección que falló

---

**¡LISTO! Ahora sigue los pasos.**

