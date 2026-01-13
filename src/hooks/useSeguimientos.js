import { useEffect, useState } from 'react'
import { getCaseFollowups } from '../api/db'

export function useSeguimientos(casoId, refreshKey = 0) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false) // Start with false since we check !casoId first

  useEffect(() => {
    async function cargarSeguimientos() {
      // Guard against undefined/null/empty caseId
      if (!casoId || typeof casoId !== 'string' || casoId.trim() === '') {
        setData([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        // ✅ OBTENER SEGUIMIENTOS DEL CASO DESDE SUPABASE
        const followups = await getCaseFollowups(casoId)

        // 🔹 Orden cronológico
        followups.sort(
          (a, b) =>
            new Date(a.fields.Fecha_Seguimiento) -
            new Date(b.fields.Fecha_Seguimiento)
        )

        setData(followups)
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
