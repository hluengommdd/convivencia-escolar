export default function CaseRow({ caso, selected, onSelect }) {
  const gravedadMap = {
    Leve: { label: 'Leve', color: 'bg-green-100 text-green-800' },
    Grave: { label: 'Grave', color: 'bg-yellow-100 text-yellow-800' },
    'Muy Grave': { label: 'Muy Grave', color: 'bg-purple-100 text-purple-800' },
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
      className={`grid grid-cols-6 gap-4 p-5 cursor-pointer transition-all duration-200 rounded-2xl
        ${selected ? 'ring-2 ring-red-500 shadow-md bg-red-50/40 transform scale-[1.01]' : 'card hover:shadow-sm'}`}
    >
      <div className="text-sm font-semibold text-gray-900">{caso.fields.ID_Caso}</div>

      <div className="text-sm">
        {caso.fields.Fecha_Incidente}
        <div className="text-xs text-gray-500 mt-0.5">
          {caso.fields.Hora_Incidente}
        </div>
      </div>

      <div className="text-sm break-words max-w-full font-medium text-gray-800">
        {caso.fields.Estudiante_Responsable}
      </div>

      <div className="text-sm break-words max-w-full whitespace-pre-wrap text-gray-700">
        {caso.fields.Categoria_Conducta}
      </div>

      <span
        className={`text-xs font-semibold px-3 py-1.5 rounded-xl w-fit shadow-sm ${gravedad.color}`}
      >
        {gravedad.label}
      </span>

      <span className="text-xs px-3 py-1.5 rounded-xl bg-gray-100 text-gray-700 w-fit font-medium shadow-sm">
        {caso.fields.Estado}
      </span>
    </div>
  )
}
