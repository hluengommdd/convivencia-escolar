export default function CaseRow({ caso, selected, onSelect }) {
  const gravedadMap = {
    Leve: { label: 'Leve', color: 'bg-blue-100 text-blue-800' },
    Grave: { label: 'Grave', color: 'bg-yellow-100 text-yellow-800' },
    'Muy Grave': { label: 'Muy Grave', color: 'bg-orange-100 text-orange-800' },
    Gravísima: { label: 'Gravísima', color: 'bg-red-100 text-red-800' },

  }

  const gravedad =
    gravedadMap[caso.fields.Tipificacion_Conducta] || {
      label: caso.fields.Tipificacion_Conducta,
      color: 'bg-gray-100 text-gray-700',
    }

  return (
    <div
      onClick={() => onSelect(caso)}
      className={`grid grid-cols-6 gap-4 p-4 border rounded-lg cursor-pointer transition
        ${selected ? 'ring-2 ring-red-500 bg-red-50' : 'bg-white hover:bg-gray-50'}`}
    >
      <div className="text-sm font-medium">{caso.fields.ID_Caso}</div>

      <div className="text-sm">
        {caso.fields.Fecha_Incidente}
        <div className="text-xs text-gray-500">
          {caso.fields.Hora_Incidente}
        </div>
      </div>

      <div className="text-sm break-words max-w-full">
        {caso.fields.Estudiante_Responsable}
      </div>

      <div className="text-sm break-words max-w-full whitespace-pre-wrap">
        {caso.fields.Categoria_Conducta}
      </div>

      <span
        className={`text-xs font-semibold px-2 py-1 rounded-full w-fit ${gravedad.color}`}
      >
        {gravedad.label}
      </span>

      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 w-fit">
        {caso.fields.Estado}
      </span>
    </div>
  )
}
