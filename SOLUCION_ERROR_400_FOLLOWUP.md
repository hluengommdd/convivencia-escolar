# Solución: Error 400 al crear followup

## Problema
Al intentar cerrar un caso, el error 400 se produce al intentar insertar un registro en `case_followups`.

## Soluciones a probar (en orden):

### Opción 1: Verificar que RLS está deshabilitado (RÁPIDO)

1. Ve a Supabase → Authentication → Policies
2. Busca la tabla `case_followups`
3. Si RLS está **habilitado**, deshabilitalo temporalmente:
   - Click en el toggle de RLS
   - Confirma

Luego intenta cerrar el caso nuevamente.

---

### Opción 2: Si RLS está habilitado, agregar política de inserción (RECOMENDADO)

Si necesitas RLS habilitado, ejecuta este SQL en el SQL Editor:

```sql
-- Habilitar RLS en case_followups (si no está ya habilitado)
ALTER TABLE public.case_followups ENABLE ROW LEVEL SECURITY;

-- Política de inserción para usuarios autenticados
CREATE POLICY "allow_insert_for_authenticated"
  ON public.case_followups
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política de selección para usuarios autenticados
CREATE POLICY "allow_select_for_authenticated"
  ON public.case_followups
  FOR SELECT
  TO authenticated
  USING (true);

-- Política de actualización para usuarios autenticados
CREATE POLICY "allow_update_for_authenticated"
  ON public.case_followups
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

---

### Opción 3: Verificar que la tabla exists

En SQL Editor, ejecuta:

```sql
-- Verificar estructura de la tabla
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'case_followups'
ORDER BY ordinal_position;
```

Debería mostrar columnas como:
- `id` (uuid, NOT NULL)
- `case_id` (uuid, NOT NULL)
- `action_date` (date, NOT NULL)
- `action_type` (text, NOT NULL)
- `process_stage` (text, nullable)
- `detail` (text, nullable)
- `description` (text, nullable)
- `responsible` (text, nullable)
- `observations` (text, nullable)

---

## Después de aplicar la solución

Intenta cerrar un caso nuevamente. Debería funcionar sin error 400.

Si persiste el error, comparte la respuesta del SQL de verificación (Opción 3) para diagnosticar mejor.
