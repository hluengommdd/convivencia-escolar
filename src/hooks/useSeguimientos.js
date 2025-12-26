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

        // ✅ FILTRADO DIRECTO EN AIRTABLE
        const formula = `FIND("${casoId}", ARRAYJOIN(CASOS_ACTIVOS))`

        const records = await getRecords(
          'SEGUIMIENTOS',
          null,
          formula
        )

        // 🔹 Orden cronológico
        records.sort(
          (a, b) =>
            new Date(a.fields.Fecha) -
            new Date(b.fields.Fecha)
        )

        setData(records)
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
