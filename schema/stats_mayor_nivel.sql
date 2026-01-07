-- Función: Nivel con mayor cantidad de casos
-- Devuelve el nivel (por ejemplo: 'Primaria' o 'Secundaria') con más casos en el periodo

CREATE OR REPLACE FUNCTION stats_mayor_nivel(desde date, hasta date)
RETURNS TABLE (
  level text,
  total bigint
) 
LANGUAGE sql
AS $$
  SELECT COALESCE(s.level, 'Desconocido') AS level,
         COUNT(*)::bigint AS total
  FROM cases c
  LEFT JOIN students s ON s.id = c.student_id
  WHERE (c.incident_date BETWEEN $1 AND $2)
  GROUP BY s.level
  ORDER BY COUNT(*) DESC
  LIMIT 1;
$$;

-- Nota: Si tu columna de fecha o nombre de columna es distinto (p.ej. "fecha_incidente"),
-- adapta `c.incident_date` o `c.level` antes de ejecutar en Supabase.
