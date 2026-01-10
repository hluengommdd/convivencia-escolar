import { useEffect, useState } from 'react'
import { getInvolucrados, addInvolucrado, updateInvolucrado, deleteInvolucrado } from '../api/db'
import { useToast } from '../hooks/useToast'
import InvolucradoRow from './InvolucradoRow'

const ROLES = ['Afectado', 'Agresor', 'Testigo', 'Denunciante']

export default function InvolucradosList({ casoId, readOnly = false }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [nombre, setNombre] = useState('')
  const [rol, setRol] = useState('')
  const { push } = useToast()

  useEffect(() => {
    if (!casoId) return setItems([])
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const data = await getInvolucrados(casoId)
        if (mounted) setItems(data || [])
      } catch (e) {
        console.error(e)
        push({ type: 'error', title: 'Error', message: 'No se pudieron cargar involucrados' })
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [casoId])

  async function handleAdd() {
    if (!nombre.trim() || !rol) {
      push({ type: 'error', title: 'Datos', message: 'Nombre y rol son requeridos' })
      return
    }

    try {
      const created = await addInvolucrado({ caso_id: casoId, nombre: nombre.trim(), rol, contacto: null })
      setItems(prev => [...prev, created])
      setNombre('')
      setRol('')
      setShowForm(false)
      push({ type: 'success', title: 'Agregado', message: 'Involucrado agregado' })
    } catch (e) {
      console.error(e)
      push({ type: 'error', title: 'Error', message: 'No se pudo agregar involucrado' })
    }
  }

  async function handleUpdate(updated) {
    try {
      const saved = await updateInvolucrado(updated.id, { nombre: updated.nombre, rol: updated.rol })
      setItems(prev => prev.map(i => i.id === saved.id ? saved : i))
      push({ type: 'success', title: 'Actualizado', message: 'Involucrado actualizado' })
    } catch (e) {
      console.error(e)
      push({ type: 'error', title: 'Error', message: 'No se pudo actualizar' })
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar involucrado?')) return
    try {
      await deleteInvolucrado(id)
      setItems(prev => prev.filter(i => i.id !== id))
      push({ type: 'success', title: 'Eliminado', message: 'Involucrado eliminado' })
    } catch (e) {
      console.error(e)
      push({ type: 'error', title: 'Error', message: 'No se pudo eliminar' })
    }
  }

  if (!casoId) return <div className="text-sm text-gray-500">No hay caso seleccionado.</div>

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <h3 className="text-lg font-semibold mb-3">Involucrados</h3>

      {loading ? (
        <div className="text-sm text-gray-500">Cargando...</div>
      ) : (
        <div className="space-y-2">
          {items.length === 0 && <div className="text-sm text-gray-500">No hay personas registradas.</div>}
          {items.map(it => (
            <div key={it.id} className="p-2 border rounded flex items-center justify-between">
              <div>
                <div className="font-medium">{it.nombre}</div>
                <div className="text-xs text-gray-600">{it.rol} {it.metadata?.curso ? `· ${it.metadata.curso}` : ''}</div>
              </div>
              {!readOnly && (
                <div className="flex items-center gap-2">
                  <button onClick={() => handleDelete(it.id)} className="text-sm text-red-600">Eliminar</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!readOnly && (
        <div className="mt-4">
          {!showForm ? (
            <button onClick={() => setShowForm(true)} className="px-3 py-2 border rounded text-sm">Agregar involucrado</button>
          ) : (
            <div className="space-y-2">
              <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre" className="w-full border p-2 rounded" />
              <select value={rol} onChange={e => setRol(e.target.value)} className="w-full border p-2 rounded">
                <option value="">Selecciona rol</option>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <div className="flex gap-2 justify-end">
                <button onClick={() => { setShowForm(false); setNombre(''); setRol('') }} className="px-3 py-2 border rounded">Cancelar</button>
                <button onClick={handleAdd} className="px-3 py-2 bg-blue-600 text-white rounded">Agregar</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
