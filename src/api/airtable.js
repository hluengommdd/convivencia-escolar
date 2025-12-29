const BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID
const API_KEY = import.meta.env.VITE_AIRTABLE_API_KEY

if (!BASE_ID || !API_KEY) {
  console.error('Airtable: faltan variables de entorno VITE_AIRTABLE_BASE_ID / VITE_AIRTABLE_API_KEY')
  throw new Error(
    'Airtable config: define VITE_AIRTABLE_BASE_ID and VITE_AIRTABLE_API_KEY in a .env.local file (see README)'
  )
}

const BASE_URL = `https://api.airtable.com/v0/${BASE_ID}`

const headers = {
  Authorization: `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
}

// 🔹 OBTENER REGISTROS (con view + filterByFormula + paginación)
export async function getRecords(table, view, filterFormula) {
  const records = []
  let offset = null

  do {
    const params = new URLSearchParams()

    if (view) params.set('view', view)
    if (filterFormula) params.set('filterByFormula', filterFormula)
    if (offset) params.set('offset', offset)

    const url = `${BASE_URL}/${encodeURIComponent(table)}?${params.toString()}`

    const res = await fetch(url, { headers })
    if (!res.ok) {
      const txt = await res.text()
      throw new Error(txt)
    }

    const data = await res.json()
    records.push(...(data.records || []))
    offset = data.offset || null
  } while (offset)

  return records
}

// ✅ OBTENER 1 REGISTRO POR ID
export async function getRecord(table, recordId) {
  const res = await fetch(
    `${BASE_URL}/${encodeURIComponent(table)}/${recordId}`,
    { headers }
  )

  if (!res.ok) {
    const txt = await res.text()
    throw new Error(txt)
  }

  return res.json()
}

// 🔹 CREAR REGISTRO
export async function createRecord(table, fields) {
  const url = `${BASE_URL}/${encodeURIComponent(table)}`
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ fields }),
  })

  if (!res.ok) {
    const txt = await res.text()
    throw new Error(txt)
  }

  return res.json()
}

// 🔹 ACTUALIZAR REGISTRO
export async function updateRecord(table, recordId, fields) {
  const res = await fetch(
    `${BASE_URL}/${encodeURIComponent(table)}/${recordId}`,
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ fields }),
    }
  )

  if (!res.ok) {
    const txt = await res.text()
    throw new Error(txt)
  }

  return res.json()
}
