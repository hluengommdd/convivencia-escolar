# 🎯 Guía de Testing - Trinidad Case

## 🚀 Inicio rápido

Dev server está corriendo en: **http://localhost:5173**

---

## 📋 Pasos de Testing

### Paso 1: Acceder a la App
1. Abre http://localhost:5173 en tu navegador
2. Deberías ver la aplicación de **Convivencia Escolar**

---

### Paso 2: Ir a Casos Activos
1. En el sidebar izquierdo, haz click en **"Casos Activos"**
2. Deberías ver una lista de casos

---

### Paso 3: Buscar Trinidad
1. En la lista de **Casos Activos**, busca o scroll hasta encontrar **TRINIDAD**
2. Verifica que su estado sea **"Reportado"** (debe estar en rojo/naranja)
3. Haz click en Trinidad para abrir el panel de detalles

---

### Paso 4: Iniciar Debido Proceso
1. En el panel de detalles de Trinidad, busca el botón **"Iniciar debido proceso"**
2. **Haz click** en el botón
3. **Espera 2-3 segundos** a que se actualice

**✅ ESPERADO**:
- El botón desaparece
- Trinity debería cambiar de estado a **"En Seguimiento"** (color verde)
- La fila debería actualizarse

---

### Paso 5: Verificar que aparece en "Seguimientos"
1. En el sidebar, haz click en **"Seguimientos"**
2. En el dropdown, selecciona **Trinidad** (o busca en la lista)
3. **Debería aparecer Trinity en la lista**

**✅ ESPERADO**:
- Trinidad está en la lista de "Seguimientos"
- Puedes hacer click en ella
- Se abre el panel de detalles

---

### Paso 6: Verificar el formulario de Seguimiento
1. Una vez en la página de Seguimientos de Trinidad
2. Busca el botón **"Nuevo Seguimiento"** o "+"
3. Haz click para abrir el formulario

**✅ ESPERADO**:
- Se abre un formulario con campos:
  - Tipo de Acción
  - Etapa (Debido Proceso)
  - Fecha
  - Descripción

---

### Paso 7: Guardar un Seguimiento (SIN ERROR 400)
1. **Llena el formulario** de ejemplo:
   - Tipo de Acción: `Entrevista`
   - Etapa: `4. Entrevistas` (o cualquiera)
   - Fecha: Hoy (16/01/2026)
   - Descripción: `Test seguimiento`

2. **Haz click en "Guardar"**

3. **VERIFICA**:
   - ❌ NO debe aparecer ERROR 400
   - ✅ Debe haber notificación "Guardado exitosamente"
   - ✅ El seguimiento debe aparecer en la lista

**Si hay ERROR**: 
- Abre la consola (F12)
- Copia el error
- Verifica que Supabase ejecutó correctamente la SQL

---

### Paso 8: Busca el botón "Cierre de caso"
1. En la página de Seguimientos de Trinidad
2. **Scroll down** al fondo de la página
3. Busca el botón rojo **"Cierre de caso"**

**✅ ESPERADO**:
- El botón está visible (rojo)
- Puedes hacer click en él

---

### Paso 9: Verifica otros casos (regresión)
1. Ve a **Casos Activos**
2. Busca otros casos como **AGUSTIN** o **FLORENCIA**
3. Verifica que:
   - Sigan apareciéndose
   - Puedan abrirse
   - No haya errores

---

## ✅ Checklist de Éxito

| Paso | Acción | Resultado | Status |
|------|--------|-----------|--------|
| 1 | Acceder a app | Carga OK | [ ] |
| 2 | Ir a Casos Activos | Lista visible | [ ] |
| 3 | Buscar Trinidad | Encontrado en "Reportado" | [ ] |
| 4 | Click "Iniciar debido proceso" | Transiciona a "En Seguimiento" | [ ] |
| 5 | Ver en "Seguimientos" | Trinity aparece en lista | [ ] |
| 6 | Abrir Seguimientos | Formulario visible | [ ] |
| 7 | Guardar seguimiento | ✅ Sin ERROR 400 | [ ] |
| 8 | Botón "Cierre de caso" | Visible y funcional | [ ] |
| 9 | Otros casos | No rotos, funcionan igual | [ ] |

---

## 🐛 Si hay problemas

### Error 400 al guardar
**Causa probable**: Supabase SQL no se ejecutó completamente

**Solución**:
1. Ve a Supabase SQL Editor
2. Ejecuta CHECK 3 de CHECKLIST_MONITOREO.md
3. Verifica que `action_type` no sea NULL

### Trinidad sigue en "Reportado"
**Causa probable**: RPC no se actualizó correctamente

**Solución**:
1. Ve a Supabase → Stored Procedures → `start_due_process`
2. Verifica que tenga: `status in ('Reportado', 'Activo')`
3. Si no, actualiza manualmente

### El botón "Iniciar" no desaparece
**Solución**:
1. Haz F12 para abrir console
2. Busca logs que digan "🚀 Iniciando debido proceso"
3. Si hay error, cópialo

### Seguimiento no se guarda
**Solución**:
1. Abre F12 → Console
2. Busca error de Supabase
3. Verifica que todos los campos estén llenos

---

## 📊 Monitoreo en Console (F12)

Abre la consola (F12) y busca estos logs:

**NORMAL**:
```
✅ Debido proceso iniciado correctamente
✅ Caso actualizado
✅ Seguimiento guardado
```

**PROBLEMA**:
```
❌ Error: INSERT violates NOT NULL constraint
❌ RPC error
❌ Supabase offline
```

---

## 🎯 Resultado Final Esperado

**Antes**:
```
Trinidad (Reportado) 
  → Click "Iniciar"
  → Nada pasa ❌
  → ERROR 400 ❌
  → No aparece en Seguimientos ❌
```

**Después**:
```
Trinidad (Reportado)
  → Click "Iniciar"
  → Transiciona a "En Seguimiento" ✅
  → Aparece en Seguimientos ✅
  → Guardas seguimiento sin ERROR ✅
  → Botón "Cierre de caso" visible ✅
```

---

## 📞 Próximos pasos

1. ✅ Ejecuta los tests arriba
2. ✅ Completa el checklist
3. ✅ Si todo OK → El sistema está funcional
4. ❌ Si hay problemas → Reporta error + logs de console

