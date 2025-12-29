import { useEffect, useState } from 'react'
import { getRecords } from '../api/airtable'

export function useAirtable(table, view, filterFormula, refreshTrigger = 0) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        setLoading(true)
        setError(null)

        const records = await getRecords(table, view, filterFormula)

        if (mounted) setData(records)
      } catch (e) {
        if (mounted) setError(e?.message || 'Error al cargar datos')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [table, view, filterFormula, refreshTrigger])

  return { data, loading, error }
}
