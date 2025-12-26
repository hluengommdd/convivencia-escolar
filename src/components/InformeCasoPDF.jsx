import SeguimientoItem from './SeguimientoItem'

export default function InformeCasoPDF({ caso, seguimientos }) {
  return (
    <div className="p-10 text-black font-sans">
      {/* ENCABEZADO */}
      <div className="border-b pb-4 mb-6">
        <h1 className="text-2xl font-bold">
          INFORME DE CIERRE DE CASO
        </h1>
        <p className="text-sm mt-1">
          Fecha de emisión:{' '}
          {new Date().toLocaleDateString()}
        </p>
      </div>

      {/* IDENTIFICACIÓN */}
      <h2 className="text-lg font-semibold mt-6 mb-2">
        1. Identificación del Caso
      </h2>
      <div className="border p-4 mb-4 text-sm">
        <p><strong>ID Caso:</strong> {caso.fields.ID_Caso}</p>
        <p><strong>Estudiante:</strong> {caso.fields.Estudiante_Responsable}</p>
        <p><strong>Curso:</strong> {caso.fields.Curso_Incidente}</p>
        <p><strong>Fecha incidente:</strong> {caso.fields.Fecha_Incidente}</p>
        <p><strong>Hora:</strong> {caso.fields.Hora_Incidente}</p>
        <p><strong>Tipificación:</strong> {caso.fields.Tipificacion_Conducta}</p>
        <p><strong>Categoría:</strong> {caso.fields.Categoria_Conducta}</p>
      </div>

      {/* DESCRIPCIÓN */}
      <h2 className="text-lg font-semibold mt-6 mb-2">
        2. Descripción del Hecho
      </h2>
      <div className="border p-4 mb-4 text-sm">
        {caso.fields.Descripcion_Breve}
      </div>

      {/* SEGUIMIENTO */}
      <h2 className="text-lg font-semibold mt-6 mb-2">
        3. Seguimiento y Medidas Adoptadas
      </h2>
      <div className="space-y-4">
        {seguimientos.map(seg => (
          <div key={seg.id}>
            <SeguimientoItem seg={seg} />
          </div>
        ))}
      </div>

      {/* RESOLUCIÓN */}
      <h2 className="text-lg font-semibold mt-6 mb-2">
        4. Resolución Final
      </h2>
      <div className="border p-4 text-sm">
        El caso fue cerrado conforme al debido proceso
        establecido en el reglamento interno de convivencia
        escolar.
      </div>

      {/* FIRMAS */}
      <div className="grid grid-cols-2 gap-16 mt-16 text-center text-sm">
        <div>
          <div className="border-t pt-2">
            Dirección
          </div>
        </div>
        <div>
          <div className="border-t pt-2">
            Encargado(a) de Convivencia Escolar
          </div>
        </div>
      </div>
    </div>
  )
}
