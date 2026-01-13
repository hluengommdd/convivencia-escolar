import React from 'react'
import { useSeguimientos } from '../hooks/useSeguimientos'
import SeguimientoItem from '../components/SeguimientoItem'

export default function ControlDePlazos({ casoId, refreshKey }) {
  const { data: seguimientos = [], loading } = useSeguimientos(casoId, refreshKey)

  if (!casoId) return <div className="text-sm text-gray-500">Selecciona un caso.</div>

  return (
    <div className="relative">
      {loading && <p className="text-sm text-gray-500">Cargando seguimientos…</p>}

      {!loading && (seguimientos || []).length === 0 && (
        <p className="text-sm text-gray-500">No hay acciones registradas.</p>
      )}

      {!loading && (seguimientos || []).length > 0 && (
        <>
          <div className="absolute left-4 top-2 bottom-2 w-px bg-slate-200" aria-hidden />
          <div className="space-y-4">
            {(seguimientos || []).map((seg, idx) => (
              <div key={seg.id} className="relative pl-10">
                <div className={`absolute left-3 top-5 w-2 h-2 rounded-full ${idx === 0 ? 'bg-blue-600' : 'bg-slate-300'}`} />
                <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                  <SeguimientoItem seg={seg} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
