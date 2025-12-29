import { useEffect, useState } from 'react'
import { getRecords } from '../api/airtable'

export function useSeguimientos(casoId, refreshKey = 0) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargarSeguimientos() {
      if (!casoId) {
        setData([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        // ✅ OBTENER TODOS LOS SEGUIMIENTOS Y FILTRAR EN EL CLIENTE
        // No pasar una vista para evitar que una vista con filtros o campos ocultos
        // impida que recuperemos registros vinculados a casos cerrados.
        const allRecords = await getRecords('SEGUIMIENTOS', null)

        // 🔹 FILTRAR EN EL CLIENTE por CASOS_ACTIVOS
        const filtered = allRecords.filter(record => {
          const casosIds = record.fields?.CASOS_ACTIVOS || []
          return casosIds.includes(casoId)
        })

        // 🔹 Orden cronológico
        filtered.sort(
          (a, b) =>
            new Date(a.fields.Fecha) -
            new Date(b.fields.Fecha)
        )

        setData(filtered)
      } catch (e) {
        console.error(e)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    cargarSeguimientos()
  }, [casoId, refreshKey])

  return { data, loading }
}
