export default function ProcesoVisualizer({
  stages = [],
  currentStageKey = null,
  completedStageKeys = [],
  stageSlaMap = {},
}) {
  const completedSet = new Set(completedStageKeys)

  return (
    <div className="flex flex-wrap gap-2">
      {stages.map((stageKey, index) => {
        const isCompleted = completedSet.has(stageKey)
        const isCurrent = stageKey === currentStageKey
        const sladays = stageSlaMap?.[stageKey] ?? null

        const stageNum = index + 1
        const stageNameRaw = stageKey.split('.')[1]?.trim() || stageKey
        const stageName = stageNameRaw.length > 18 ? stageNameRaw.slice(0, 18) + '…' : stageNameRaw

        let bgClass, textClass, borderClass
        if (isCompleted) {
          bgClass = 'bg-emerald-50'
          textClass = 'text-emerald-800'
          borderClass = 'border-emerald-200'
        } else if (isCurrent) {
          bgClass = 'bg-blue-50'
          textClass = 'text-blue-800'
          borderClass = 'border-blue-300'
        } else {
          bgClass = 'bg-gray-50'
          textClass = 'text-gray-700'
          borderClass = 'border-gray-200'
        }

        return (
          <div
            key={stageKey}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${bgClass} ${textClass} ${borderClass}`}
            title={sladays === null ? 'Sin SLA' : `SLA: ${sladays} días`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-extrabold text-white ${
                isCompleted ? 'bg-emerald-600' : isCurrent ? 'bg-blue-700' : 'bg-gray-400'
              }`}
            >
              {isCompleted ? '✓' : stageNum}
            </span>

            <span className="truncate max-w-[170px]">{stageName}</span>

            {sladays !== null && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-black/5 text-[11px] font-bold">
                {sladays}d
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
