# Instrucciones: Actualizar RPC en Supabase

## ⚠️ PROBLEMA ENCONTRADO

El RPC `start_due_process` actual en Supabase **NO maneja el status 'Reportado'**.

Descargué la estructura actual de Supabase y encontré que el RPC solo hace:
```sql
status = case when c.status = 'Activo' then 'En Seguimiento' else c.status end
```

**Esto significa**: Solo actualiza casos con status 'Activo'. Los casos con status 'Reportado' (como Trinidad) quedan sin actualizar.

---

## ✅ SOLUCIÓN

Necesitas ejecutar el SQL actualizado en Supabase SQL Editor.

### Paso 1: Ve a Supabase Dashboard
1. Ve a: https://app.supabase.com/
2. Selecciona tu proyecto
3. Ve a **SQL Editor** (en el menú izquierdo)

### Paso 2: Copia y ejecuta el SQL

Copia TODO el siguiente SQL y pégalo en el SQL Editor:

```sql
CREATE OR REPLACE FUNCTION public.start_due_process(
  p_case_id uuid,
  p_sla_days integer DEFAULT 10
)
RETURNS void
LANGUAGE plpgsql
AS $$
declare
  v_now timestamptz := now();
  v_start_date date := (v_now at time zone 'UTC')::date;
begin
  update public.cases c
  set
    -- inicio explícito (primera vez)
    seguimiento_started_at = coalesce(c.seguimiento_started_at, v_now),

    -- el reloj del SLA parte aquí: se recalcula start/due desde hoy
    indagacion_start_date = coalesce(c.indagacion_start_date, v_start_date),
    indagacion_due_date = coalesce(
      c.indagacion_due_date,
      public.add_business_days(v_start_date, coalesce(p_sla_days, 10))
    ),

    -- estado: AHORA MANEJA 'Reportado' Y 'Activo'
    status = case 
      when c.status in ('Reportado', 'Activo') then 'En Seguimiento'
      else c.status 
    end
  where c.id = p_case_id;
end;
$$;
```

### Paso 3: Click en "Run"
- Click en el botón azul **"Run"** arriba a la derecha
- Deberías ver un mensaje de éxito

---

## 🔍 CAMBIOS CLAVE

### Antes (INCORRECTO):
```sql
status = case when c.status = 'Activo' then 'En Seguimiento' else c.status end
```

### Después (CORRECTO):
```sql
status = case when c.status in ('Reportado', 'Activo') then 'En Seguimiento' else c.status end
```

**Y también cambió la línea de WHERE:**

### Antes (evitaba reinicios):
```sql
where c.id = p_case_id
  and c.seguimiento_started_at is null; -- 👈 evita reinicios
```

### Después (permite actualizar):
```sql
where c.id = p_case_id;
```

---

## ✅ DESPUÉS DE EJECUTAR

1. Ve a Casos Activos
2. Haz click en Trinidad
3. Haz click "Iniciar debido proceso"
4. ¡Debería funcionar sin errores!
5. El estado debería cambiar de "Reportado" a "En Seguimiento"
6. Trinidad debería aparecer en el sidebar "Seguimientos"

---

## 📋 VERIFICACIÓN

Si todo funcionó, deberías ver en la consola del navegador (F12):

```
🚀 Iniciando debido proceso para caso: (ID)
Estado actual: Reportado
✅ Debido proceso iniciado correctamente
🔄 Caso refrescado: En Seguimiento
📍 Navegando a seguimientos
```

---

## ⚠️ Si Supabase sigue fuera de línea

Espera a que vuelva online en: https://status.supabase.com/

Luego intenta ejecutar el SQL.
