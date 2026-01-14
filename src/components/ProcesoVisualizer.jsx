export default function ProcesoVisualizer({
  stages = [],
  currentStageKey = null,
  completedStageKeys = [],
  stageSlaMap = {},
}) {
  const completedSet = new Set(completedStageKeys)

  return (
    <div className="w-full">
      <div className="flex flex-row items-start justify-between gap-4 py-2">
        {stages.map((stageKey, index) => {
          const isCompleted = completedSet.has(stageKey)
          const isCurrent = stageKey === currentStageKey
          const sladays = stageSlaMap?.[stageKey] ?? null

          const stageNum = index + 1
          const stageName = stageKey.split('.')[1]?.trim() || stageKey

          const circleClass = isCompleted
            ? 'bg-emerald-600 text-white'
            : isCurrent
              ? 'bg-blue-600 text-white'
              : 'bg-gray-400 text-white'

          return (
            <div key={stageKey} className="flex-1 min-w-0 flex flex-col items-center text-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold ${circleClass}`}>
                {isCompleted ? '✓' : stageNum}
              </div>

              <div className="mt-2 text-sm font-semibold text-gray-800 leading-tight line-clamp-2">
                {stageName}
              </div>

              <div className="mt-1 text-xs text-gray-500 font-semibold">
                {sladays !== null ? `${sladays}d` : '—'}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
