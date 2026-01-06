-- Función: Responsable con mayor carga (más casos asignados)
-- Devuelve el responsable que tiene más casos en el período especificado

CREATE OR REPLACE FUNCTION stats_mayor_carga(desde date, hasta date)
RETURNS TABLE (
  responsable text,
  total bigint
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(c.responsable, 'Sin responsable') AS responsable,
    COUNT(*)::bigint AS total
  FROM cases c
  WHERE c.fecha_inicio BETWEEN desde AND hasta
    AND c.responsable IS NOT NULL
    AND c.responsable != ''
  GROUP BY c.responsable
  ORDER BY COUNT(*) DESC
  LIMIT 1;
  
  -- Si no hay datos, devolver valores por defecto
  IF NOT FOUND THEN
    RETURN QUERY SELECT 'Sin responsable'::text, 0::bigint;
  END IF;
END;
$$;

-- Nota: Ejecuta este SQL en el SQL Editor de Supabase
-- Dashboard > SQL Editor > New query > Pega este código > Run
