import { useRef, useState } from 'react'
import { createFollowup } from '../api/db'
import { uploadEvidenceFiles } from '../api/evidence'
import { useToast } from '../hooks/useToast'

export default function SeguimientoForm({ casoId, onSaved }) {
  const [tipoAccion, setTipoAccion] = useState('')
  const [etapa, setEtapa] = useState('')
  const [estado, setEstado] = useState('Completada')
  const [responsable, setResponsable] = useState('')
  const [detalle, setDetalle] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef(null)
  const { push } = useToast()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!tipoAccion || !etapa) {
      push({ type: 'error', title: 'Datos incompletos', message: 'Selecciona tipo de acción y etapa' })
      return
    }

    try {
      setLoading(true)

      // 📅 Fecha base (registro)
      const hoy = new Date()
      const fechaISO = hoy.toISOString().slice(0, 10)

      // Crear seguimiento en Supabase
      const followup = await createFollowup({
        Caso_ID: casoId,
        Fecha_Seguimiento: fechaISO,
        Tipo_Accion: tipoAccion,
        Etapa_Debido_Proceso: etapa,
        Descripcion: detalle || tipoAccion,
        Acciones: responsable || 'Por asignar',
        Responsable: responsable || 'Por asignar',
        Estado_Etapa: estado,
        Detalle: detalle,
        Observaciones: observaciones,
      })

      if (files.length) {
        await uploadEvidenceFiles({ caseId: casoId, followupId: followup.id, files })
      }

      push({
        type: 'success',
        title: 'Seguimiento guardado',
        message: files.length ? 'Acción y evidencias registradas' : 'Acción registrada',
      })
      onSaved?.()

      // 🔄 Reset form
      setTipoAccion('')
      setEtapa('')
      setEstado('Completada')
      setResponsable('')
      setDetalle('')
      setObservaciones('')
      setFiles([])
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (e) {
      console.error(e)
      push({ type: 'error', title: 'Error al guardar', message: e?.message || 'Intenta nuevamente' })
      alert('Error al guardar seguimiento: ' + e.message)
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
        <option value="">Etapa del debido proceso</option>
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

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Evidencias (opcional)</label>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={e => setFiles(Array.from(e.target.files || []))}
          className="w-full"
        />
        {files.length > 0 && (
          <ul className="text-sm text-gray-600 list-disc list-inside">
            {files.map(file => (
              <li key={file.name}>{file.name}</li>
            ))}
          </ul>
        )}
      </div>

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
