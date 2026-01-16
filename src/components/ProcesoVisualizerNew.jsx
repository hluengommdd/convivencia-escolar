export default function ProcesoVisualizer({
  stages = [],
  currentStageKey = null,
  completedStageKeys = [],
  stageSlaMap = {},
}) {
  const completedSet = new Set(completedStageKeys)

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex gap-1 pb-4 min-w-max sm:flex-wrap">
        {stages.map((stageKey, index) => {
          const isCompleted = completedSet.has(stageKey)
          const isCurrent = stageKey === currentStageKey
          const sladays = stageSlaMap?.[stageKey] ?? null

          const stageNum = index + 1
          const stageNameRaw = stageKey.split('.')[1]?.trim() || stageKey
          const stageName = stageNameRaw.length > 16 ? stageNameRaw.slice(0, 16) + '…' : stageNameRaw

          let bgClass, textClass, borderClass, circleClass
          
          if (isCompleted) {
            bgClass = 'bg-emerald-50 hover:bg-emerald-100'
            textClass = 'text-emerald-900'
            borderClass = 'border-emerald-300'
            circleClass = 'bg-emerald-600'
          } else if (isCurrent) {
            bgClass = 'bg-blue-50 hover:bg-blue-100'
            textClass = 'text-blue-900'
            borderClass = 'border-blue-400'
            circleClass = 'bg-blue-600 ring-2 ring-blue-200'
          } else {
            bgClass = 'bg-gray-50 hover:bg-gray-100'
            textClass = 'text-gray-700'
            borderClass = 'border-gray-300'
            circleClass = 'bg-gray-400'
          }

          return (
            <div
              key={stageKey}
              className={`flex flex-col items-center gap-2 px-3 py-2 rounded-lg border ${bgClass} ${textClass} ${borderClass} transition-all min-w-max sm:flex-1`}
              title={sladays === null ? 'Sin SLA' : `SLA: ${sladays} días`}
            >
              <div className="flex items-center justify-center gap-2">
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${circleClass} transition-all`}
                >
                  {isCompleted ? '✓' : stageNum}
                </span>
              </div>

              <span className="text-xs font-semibold text-center leading-tight truncate max-w-[90px]">
                {stageName}
              </span>

              {sladays !== null && (
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-black/10">
                  {sladays}d
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
