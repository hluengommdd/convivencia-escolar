import { useEffect, useState } from 'react'
import { createCase } from '../api/db'
import { supabase } from '../api/supabaseClient'
import { useToast } from '../hooks/useToast'

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
  Leve: 'bg-green-100 text-green-800 border-green-200',
  Grave: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Muy Grave': 'bg-purple-100 text-purple-800 border-purple-200',
  Gravísima: 'bg-red-100 text-red-800 border-red-200'
}

export default function NuevoCasoModal({ onClose, onSaved }) {
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [curso, setCurso] = useState('')
  const [cursos, setCursos] = useState([])
  const [estudiantes, setEstudiantes] = useState([])
  const [estudianteId, setEstudianteId] = useState('')
  const [tipo, setTipo] = useState('')
  const [conductas, setConductas] = useState([])
  const [descripcionLibre, setDescripcionLibre] = useState('')
  const [estado, setEstado] = useState('Activo')
  const [guardando, setGuardando] = useState(false)
  const { push } = useToast()

  /* ================= CARGA CURSOS ================= */

  useEffect(() => {
    cargarCursos()
  }, [])

  async function cargarCursos() {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('course')
        .not('course', 'is', null)
        .order('course')

      if (error) throw error

      // Obtener cursos únicos
      const cursosUnicos = [...new Set(data.map(s => s.course))].filter(Boolean)
      setCursos(cursosUnicos)
    } catch (error) {
      console.error('Error cargando cursos:', error)
    }
  }

  /* ================= CARGA ESTUDIANTES POR CURSO ================= */

  useEffect(() => {
    if (!curso) {
      setEstudiantes([])
      setEstudianteId('')
      return
    }

    async function cargarEstudiantes() {
      try {
        const { data, error } = await supabase
          .from('students')
          .select('id, first_name, last_name, course')
          .eq('course', curso)
          .order('last_name')

        if (error) throw error

        setEstudiantes(data || [])
      } catch (error) {
        console.error('Error cargando estudiantes:', error)
      }
    }

    cargarEstudiantes()
  }, [curso])

  function toggleConducta(texto) {
    setConductas(prev =>
      prev.includes(texto)
        ? prev.filter(c => c !== texto)
        : [...prev, texto]
    )
  }

  async function guardarCaso() {
    if (!fecha || !hora || !estudianteId || !tipo) {
      push({ type: 'error', title: 'Datos incompletos', message: 'Completa fecha, hora, estudiante y tipo' })
      return
    }

    try {
      setGuardando(true)
      
      // Convertir conductas seleccionadas a string separado por comas
      const categoriasConducta = conductas.length > 0 ? conductas.join(', ') : ''
      
      const casoData = {
        Fecha_Incidente: fecha,
        Hora_Incidente: hora,
        Estudiante_ID: estudianteId,
        Curso_Incidente: curso,
        Tipificacion_Conducta: tipo,
        Categoria: categoriasConducta,
        Descripcion: descripcionLibre,
        Estado: estado
      }
      
      console.log('📝 Guardando caso con datos:', casoData)
      
      await createCase(casoData)

      push({ type: 'success', title: 'Caso creado', message: 'El caso se guardó exitosamente' })
      alert('Caso creado correctamente')
      onSaved?.()
      onClose?.()
    } catch (e) {
      console.error(e)
      push({ type: 'error', title: 'Error al guardar', message: e?.message || 'Intenta nuevamente' })
      alert('Error al guardar el caso: ' + e.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-6xl relative space-y-4">

        <div className="glass bg-white/80 rounded-xl p-6 shadow-xl relative">

        {guardando && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center rounded-xl z-10">
            <div className="text-gray-700 font-medium">Guardando…</div>
          </div>
        )}

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

        {/* CURSO */}
        <select
          value={curso}
          onChange={e => setCurso(e.target.value)}
          className="w-full border rounded p-2"
        >
          <option value="">Selecciona un curso</option>
          {cursos.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* ESTUDIANTE */}
        {curso && (
          <select
            value={estudianteId}
            onChange={e => setEstudianteId(e.target.value)}
            className="w-full border rounded p-2"
          >
            <option value="">Selecciona un estudiante</option>
            {estudiantes.map(est => (
              <option key={est.id} value={est.id}>
                {est.first_name} {est.last_name}
              </option>
            ))}
          </select>
        )}

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
            disabled={guardando}
            className="btn-primary disabled:opacity-50"
          >
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
        </div>

      </div>
    </div>
  )
}
