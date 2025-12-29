import { useState } from 'react'
import { createRecord } from '../api/airtable'

export default function SeguimientoForm({ casoId, onSaved }) {
  const [tipoAccion, setTipoAccion] = useState('')
  const [etapa, setEtapa] = useState('')
  const [estado, setEstado] = useState('Pendiente')
  const [responsable, setResponsable] = useState('')
  const [detalle, setDetalle] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!tipoAccion || !etapa) return

    try {
      setLoading(true)

      // 📅 Fecha base (registro)
      const hoy = new Date()
      const fechaISO = hoy.toISOString().slice(0, 10)

      // ⏱️ Fecha plazo: +10 días hábiles (simplificado a 14 corridos)
      const plazo = new Date(hoy)
      plazo.setDate(plazo.getDate() + 14)
      const fechaPlazoISO = plazo.toISOString().slice(0, 10)

      // Nota: `Fecha_Plazo` es un campo calculado en Airtable (no aceptar valores),
      // por eso lo omitimos de la carga. Airtable calculará el valor automáticamente.
      await createRecord('SEGUIMIENTOS', {
        Fecha: fechaISO,
        Tipo_Accion: tipoAccion,
        Etapa_Debido_Proceso: etapa,
        Estado_Etapa: estado,
        Responsable: responsable,
        Detalle: detalle,
        Observaciones: observaciones,
        CASOS_ACTIVOS: [casoId],
      })

      onSaved?.()

      // 🔄 Reset form
      setTipoAccion('')
      setEtapa('')
      setEstado('Pendiente')
      setResponsable('')
      setDetalle('')
      setObservaciones('')
    } catch (e) {
      console.error(e)
      alert('Error al guardar seguimiento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <select
        value={tipoAccion}
        onChange={e => setTipoAccion(e.target.value)}
        className="w-full border rounded p-2"
        required
      >
        <option value="">Tipo de acción</option>
        <option>Denuncia/Reporte</option>
        <option>Entrevista Estudiante</option>
        <option>Citación Apoderados</option>
        <option>Investigación</option>
        <option>Resolución</option>
        <option>Seguimiento</option>
      </select>

      <select
        value={etapa}
        onChange={e => setEtapa(e.target.value)}
        className="w-full border rounded p-2"
        required
      >
        <option value="">Etapa del proceso</option>
        <option>1. Comunicación/Denuncia</option>
        <option>2. Notificación Apoderados</option>
        <option>3. Recopilación Antecedentes</option>
        <option>4. Entrevistas</option>
        <option>5. Investigación/Análisis</option>
        <option>6. Resolución y Sanciones</option>
        <option>7. Apelación/Recursos</option>
        <option>8. Seguimiento</option>
      </select>

      <select
        value={estado}
        onChange={e => setEstado(e.target.value)}
        className="w-full border rounded p-2"
      >
        <option>Pendiente</option>
        <option>En Proceso</option>
        <option>Completada</option>
      </select>

      <input
        type="text"
        value={responsable}
        onChange={e => setResponsable(e.target.value)}
        placeholder="Responsable"
        className="w-full border rounded p-2"
      />

      <textarea
        value={detalle}
        onChange={e => setDetalle(e.target.value)}
        placeholder="Detalle de la acción"
        className="w-full border rounded p-2 min-h-[80px]"
      />

      <textarea
        value={observaciones}
        onChange={e => setObservaciones(e.target.value)}
        placeholder="Observaciones"
        className="w-full border rounded p-2 min-h-[80px]"
      />

      

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 disabled:opacity-50"
      >
        {loading ? 'Guardando…' : 'Registrar acción'}
      </button>
    </form>
  )
}
