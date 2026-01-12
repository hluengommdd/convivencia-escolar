import React from 'react'
import { useSeguimientos } from '../hooks/useSeguimientos'
import SeguimientoItem from '../components/SeguimientoItem'

export default function ControlDePlazos({ casoId, refreshKey }) {
  const { data: seguimientos = [], loading } = useSeguimientos(casoId, refreshKey)

  if (!casoId) return <div className="text-sm text-gray-500">Selecciona un caso.</div>

  return (
    <div>
      {loading && <p className="text-sm text-gray-500">Cargando seguimientos…</p>}

      {!loading && (seguimientos || []).length === 0 && (
        <p className="text-sm text-gray-500">No hay acciones registradas.</p>
      )}

      <div className="space-y-3">
        {(seguimientos || []).map(seg => (
          <div key={seg.id} className="bg-white border rounded-lg p-3 shadow-sm">
            <SeguimientoItem seg={seg} />
          </div>
        ))}
      </div>
    </div>
  )
}
