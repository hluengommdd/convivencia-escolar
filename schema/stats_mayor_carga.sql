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
    COALESCE(f.responsible, 'Sin responsable') AS responsable,
    COUNT(DISTINCT f.case_id)::bigint AS total
  FROM case_followups f
  WHERE f.action_date BETWEEN desde AND hasta
    AND f.responsible IS NOT NULL
    AND f.responsible != ''
  GROUP BY f.responsible
  ORDER BY COUNT(DISTINCT f.case_id) DESC
  LIMIT 1;
  
  -- Si no hay datos, devolver valores por defecto
  IF NOT FOUND THEN
    RETURN QUERY SELECT 'Sin responsable'::text, 0::bigint;
  END IF;
END;
$$;

-- Nota: Ejecuta este SQL en el SQL Editor de Supabase
-- Dashboard > SQL Editor > New query > Pega este código > Run
