import { useEffect, useState } from 'react'
import { createRecord, getRecords } from '../api/airtable'

/* ================= TIPIFICACIONES ================= */

const TIPIFICACIONES = {
  Leve: [
    'Llegar atrasado(a) al inicio de la jornada escolar o después de los recreos, sin justificación.',
    'Asistir al establecimiento sin uniforme o con uniforme incompleto, sin autorización previa.',
    'Presentar deficiencia en la higiene o presentación personal.',
    'Asistir sin la agenda escolar correspondiente.',
    'No entregar circulares, comunicados o evaluaciones firmadas por el apoderado/a dentro del plazo establecido.',
    'Depositar basura o desperdicios fuera de los lugares habilitados.',
    'No justificar inasistencias ante el establecimiento dentro del tiempo indicado.',
    'Interrumpir el desarrollo normal de clases, actos o actividades institucionales.',
    'No entregar trabajos, tareas o evaluaciones en la fecha indicada.',
    'Asistir a clases sin materiales o sin las tareas requeridas.',
    'Comer dentro del aula sin autorización.',
    'Usar objetos que interfieran en el desarrollo de la clase.',
    'Utilizar pertenencias de otros sin consentimiento.',
    'Demostrar afecto físico inapropiado para el contexto educativo.',
    'No devolver materiales o libros a la biblioteca en el plazo acordado.'
  ],
  Grave: [
    'Faltar a la verdad u ocultar información relevante.',
    'Participar o promover disturbios.',
    'Lenguaje ofensivo o vulgar.',
    'Faltar el respeto a integrantes de la comunidad educativa.',
    'Agresión física o verbal.',
    'Copiar o difundir información durante evaluaciones.',
    'Ausentarse de clases sin autorización.',
    'Realizar colectas o ventas sin autorización.',
    'Uso de celular sin autorización.'
  ],
  'Muy Grave': [
    'Falsificar firmas o documentos.',
    'Dañar bienes del colegio.',
    'Participar en riñas.',
    'Abandonar el establecimiento sin autorización.',
    'Difusión de material pornográfico.',
    'Discriminación.',
    'Violencia física o psicológica.',
    'Amenazas u hostigamiento digital.',
    'Acoso escolar o bullying.'
  ],
  Gravísima: [
    'Violencia física grave (Ley Aula Segura).',
    'Lanzar objetos o líquidos peligrosos.',
    'Porte o uso de armas.',
    'Consumo o tráfico de drogas.',
    'Abuso o acoso sexual.'
  ]
}

/* ================= COLORES ================= */

const TIPOS_COLOR = {
  Leve: 'bg-blue-100 text-blue-700 border-blue-200',
  Grave: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Muy Grave': 'bg-orange-100 text-orange-700 border-orange-200',
  Gravísima: 'bg-red-100 text-red-700 border-red-200'
}

export default function NuevoCasoModal({ onClose, onSaved }) {
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [curso, setCurso] = useState('')
  const [estudiante, setEstudiante] = useState(null)

  const [estudiantes, setEstudiantes] = useState([])
  const [estudiantesFiltrados, setEstudiantesFiltrados] = useState([])

  const [tipo, setTipo] = useState('')
  const [conductas, setConductas] = useState([])
  const [descripcionLibre, setDescripcionLibre] = useState('')
  const [estado, setEstado] = useState('Reportado')

  /* ================= CARGA ESTUDIANTES ================= */

  useEffect(() => {
    async function cargar() {
      try {
        const data = await getRecords('ESTUDIANTES')
        setEstudiantes(data)
      } catch (e) {
        console.error('Error cargando estudiantes', e)
      }
    }
    cargar()
  }, [])

  /* ================= FILTRAR SOLO CUANDO CAMBIA CURSO ================= */

  useEffect(() => {
    if (!curso) {
      setEstudiantesFiltrados([])
      return
    }

    const filtrados = estudiantes.filter(
      e => e.fields.Curso === curso
    )

    setEstudiantesFiltrados(filtrados)
  }, [curso, estudiantes])

  function toggleConducta(texto) {
    setConductas(prev =>
      prev.includes(texto)
        ? prev.filter(c => c !== texto)
        : [...prev, texto]
    )
  }

  async function guardarCaso() {
    if (!fecha || !hora || !curso || !estudiante || !tipo) {
      alert('Completa todos los campos obligatorios')
      return
    }

    try {
      await createRecord('CASOS_ACTIVOS', {
        Fecha_Incidente: fecha,
        Hora_Incidente: hora,
        Curso_Incidente: curso,
        Nivel_Incidente: estudiante.fields.Nivel,
        Estudiante_Responsable: `${estudiante.fields.Nombres} ${estudiante.fields.Apellidos}`,
        Estudiante_Link: [estudiante.id],
        Tipificacion_Conducta: tipo,
        Categoria_Conducta: conductas.join(', '),
        Descripcion_Breve: descripcionLibre,
        Estado: estado
      })

      onSaved?.()
      onClose?.()
    } catch (e) {
      console.error(e)
      alert('Error al guardar el caso')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-6xl rounded-xl shadow-xl p-6 relative space-y-4">

        {/* CERRAR */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>

        <h2 className="text-xl font-semibold">Nuevo Caso</h2>

        {/* FECHA / HORA */}
        <div className="grid grid-cols-2 gap-3">
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="border rounded p-2" />
          <input type="time" value={hora} onChange={e => setHora(e.target.value)} className="border rounded p-2" />
        </div>

        {/* CURSO + ESTUDIANTE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            value={curso}
            onChange={e => {
              setCurso(e.target.value)
              setEstudiante(null)
            }}
            className="w-full border rounded p-2"
          >
            <option value="">Seleccionar curso</option>
            {[...new Set(estudiantes.map(e => e.fields.Curso))].map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <select
            value={estudiante?.id || ''}
            onChange={e =>
              setEstudiante(
                estudiantesFiltrados.find(es => es.id === e.target.value)
              )
            }
            className="w-full border rounded p-2"
            disabled={!curso}
          >
            <option value="">Seleccionar estudiante</option>
            {estudiantesFiltrados.map(e => (
              <option key={e.id} value={e.id}>
                {e.fields.Nombres} {e.fields.Apellidos}
              </option>
            ))}
          </select>
        </div>

        {/* TIPIFICACIÓN */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Tipo de falta
          </label>
          <div className="flex gap-2 flex-wrap">
            {Object.keys(TIPIFICACIONES).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTipo(t)
                  setConductas([])
                }}
                className={`px-3 py-1 rounded-full text-sm font-medium border ${
                  tipo === t
                    ? TIPOS_COLOR[t]
                    : 'bg-gray-100 text-gray-600 border-gray-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* CONDUCTAS */}
        {tipo && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {TIPIFICACIONES[tipo].map(texto => (
              <div
                key={texto}
                onClick={() => toggleConducta(texto)}
                className={`p-3 border rounded cursor-pointer text-sm ${
                  conductas.includes(texto)
                    ? 'bg-red-50 border-red-400'
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                {texto}
              </div>
            ))}
          </div>
        )}

        {/* DESCRIPCIÓN */}
        <textarea
          className="w-full border rounded p-2 text-sm"
          rows={3}
          placeholder="Relato breve y objetivo del hecho ocurrido…"
          value={descripcionLibre}
          onChange={e => setDescripcionLibre(e.target.value)}
        />

        {/* ESTADO */}
        <select
          value={estado}
          onChange={e => setEstado(e.target.value)}
          className="w-full border rounded p-2"
        >
          <option>Reportado</option>
          <option>En Investigación</option>
          <option>En Seguimiento</option>
        </select>

        {/* ACCIONES */}
        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={guardarCaso}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Guardar
          </button>
        </div>

      </div>
    </div>
  )
}
