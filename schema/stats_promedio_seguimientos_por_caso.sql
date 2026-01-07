-- Función: Promedio de seguimientos por caso en el periodo
-- Devuelve la media de seguimientos (followups) por caso

CREATE OR REPLACE FUNCTION stats_promedio_seguimientos_por_caso(desde date, hasta date)
RETURNS TABLE (
  promedio numeric
) 
LANGUAGE sql
AS $$
  WITH counts AS (
    SELECT f.case_id, COUNT(*) AS cnt
    FROM case_followups f
    WHERE f.action_date BETWEEN $1 AND $2
    GROUP BY f.case_id
  )
  SELECT COALESCE(AVG(cnt)::numeric, 0) AS promedio FROM counts;
$$;

-- Ejecutar en SQL Editor de Supabase para crear la RPC
