-- Función: Tiempo promedio (días) hasta el primer seguimiento desde la fecha del incidente
-- Para cada caso con al menos un followup en el periodo, calcula la diferencia entre
-- la fecha del incidente y la primera acción, y devuelve el promedio en días.

CREATE OR REPLACE FUNCTION stats_tiempo_primer_seguimiento(desde date, hasta date)
RETURNS TABLE (
  promedio_dias numeric
) 
LANGUAGE sql
AS $$
  WITH first_followups AS (
    SELECT c.id AS case_id, c.incident_date::date AS incident_date, MIN(f.action_date)::date AS first_action
    FROM cases c
    JOIN case_followups f ON f.case_id = c.id
    WHERE f.action_date BETWEEN $1 AND $2
      AND c.incident_date IS NOT NULL
    GROUP BY c.id, c.incident_date
  )
  SELECT COALESCE(AVG((first_action - incident_date)::int)::numeric, 0) AS promedio_dias
  FROM first_followups;
$$;

-- Ejecutar en SQL Editor de Supabase para crear la RPC
