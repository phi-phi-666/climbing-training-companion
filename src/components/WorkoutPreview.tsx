import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Check, RotateCcw, Loader2, Sparkles, StretchHorizontal, RefreshCw, Timer } from 'lucide-react'
import WorkoutTimer from './WorkoutTimer'
import { useExerciseHistoryBatch } from '../hooks/useSessionHistory'

interface Exercise {
  name: string
  sets?: number
  reps?: string
  supersetGroup?: number
}

interface ExerciseBlock {
  type: 'single' | 'superset' | 'circuit'
  exercises: Exercise[]
  originalIndices: number[]
}

interface WorkoutPreviewProps {
  description?: string
  exercises: Exercise[]
  onClose: () => void
  onComplete: (notesText: string) => void
  warmup?: string | null
  cooldown?: string | null
  generatingWarmupCooldown?: boolean
  onSwapExercise?: (index: number, exercise: Exercise) => Promise<Exercise>
}

export default function WorkoutPreview({
  description,
  exercises: initialExercises,
  onClose,
  onComplete,
  warmup,
  cooldown,
  generatingWarmupCooldown,
  onSwapExercise
}: WorkoutPreviewProps) {
  const [exercises, setExercises] = useState(initialExercises)
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0)
  const [completedBlocks, setCompletedBlocks] = useState<Set<number>>(new Set())
  const [showWarmupDetail, setShowWarmupDetail] = useState(false)
  const [showCooldownDetail, setShowCooldownDetail] = useState(false)
  const [swappingIndex, setSwappingIndex] = useState<number | null>(null)
  const [activeTimer, setActiveTimer] = useState<'warmup' | 'cooldown' | null>(null)
  const [exerciseActuals, setExerciseActuals] = useState<Map<number, { weight?: number; reps: number[] }>>(new Map())
  const [showLogInput, setShowLogInput] = useState(false)

  const exerciseNames = useMemo(() => exercises.map(e => e.name), [exercises])
  const exerciseHistory = useExerciseHistoryBatch(exerciseNames)

  // Group exercises into blocks (supersets/circuits/singles)
  const blocks: ExerciseBlock[] = (() => {
    const result: ExerciseBlock[] = []
    let i = 0
    while (i < exercises.length) {
      const ex = exercises[i]
      if (ex.supersetGroup != null) {
        const group = ex.supersetGroup
        const grouped: Exercise[] = []
        const indices: number[] = []
        while (i < exercises.length && exercises[i].supersetGroup === group) {
          grouped.push(exercises[i])
          indices.push(i)
          i++
        }
        result.push({
          type: grouped.length >= 3 ? 'circuit' : 'superset',
          exercises: grouped,
          originalIndices: indices
        })
      } else {
        result.push({
          type: 'single',
          exercises: [ex],
          originalIndices: [i]
        })
        i++
      }
    }
    return result
  })()

  const currentBlock = blocks[currentBlockIndex]
  const nextBlock = blocks[currentBlockIndex + 1]
  const prevBlock = blocks[currentBlockIndex - 1]
  const totalBlocks = blocks.length
  const progress = ((currentBlockIndex + 1) / totalBlocks) * 100

  const handleNext = () => {
    setCompletedBlocks(prev => new Set(prev).add(currentBlockIndex))

    if (currentBlockIndex < blocks.length - 1) {
      setCurrentBlockIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentBlockIndex > 0) {
      setCurrentBlockIndex(prev => prev - 1)
    }
  }

  const handleDone = () => {
    // Build notes text from exercises with actuals
    const notesText = exercises
      .map((ex, i) => {
        let line = ex.name
        const actual = exerciseActuals.get(i)
        if (actual?.weight || (actual?.reps && actual.reps.length > 0)) {
          const parts: string[] = []
          if (actual.weight) parts.push(`${actual.weight}kg`)
          if (actual.reps.length > 0) parts.push(actual.reps.join('/'))
          line += ` [${parts.join(' x ')}]`
        } else if (ex.sets && ex.reps) {
          line += `: ${ex.sets}x${ex.reps}`
        } else if (ex.sets) {
          line += `: ${ex.sets} sets`
        } else if (ex.reps) {
          line += `: ${ex.reps}`
        }
        return line
      })
      .join('\n')

    onComplete(notesText)
  }

  const updateActualWeight = (exIndex: number, weight: number) => {
    setExerciseActuals(prev => {
      const next = new Map(prev)
      const existing = next.get(exIndex) || { reps: [] }
      next.set(exIndex, { ...existing, weight: Math.max(0, weight) })
      return next
    })
  }

  const updateActualRep = (exIndex: number, setIdx: number, value: number) => {
    setExerciseActuals(prev => {
      const next = new Map(prev)
      const existing = next.get(exIndex) || { reps: [] }
      const reps = [...existing.reps]
      reps[setIdx] = Math.max(0, value)
      next.set(exIndex, { ...existing, reps })
      return next
    })
  }

  const handleSwap = async (index: number) => {
    if (!onSwapExercise || swappingIndex !== null) return
    setSwappingIndex(index)
    try {
      const replacement = await onSwapExercise(index, exercises[index])
      setExercises(prev => {
        const updated = [...prev]
        updated[index] = replacement
        return updated
      })
    } catch {
      // Swap failed, keep original
    } finally {
      setSwappingIndex(null)
    }
  }

  const handleRestart = () => {
    setCurrentBlockIndex(0)
    setCompletedBlocks(new Set())
  }

  const isLastBlock = currentBlockIndex === blocks.length - 1

  if (exercises.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-zinc-400 mb-4">No exercises to display</p>
        <button onClick={onClose} className="btn-secondary">
          Close
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Warmup/Cooldown status */}
      {(warmup || cooldown || generatingWarmupCooldown) && (
        <div className="flex gap-2">
          <button
            onClick={() => warmup && setShowWarmupDetail(!showWarmupDetail)}
            disabled={!warmup}
            className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg text-xs transition-all ${
              warmup
                ? 'bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 cursor-pointer'
                : 'bg-void-100 text-zinc-500'
            }`}
          >
            {generatingWarmupCooldown && !warmup ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Sparkles size={14} />
            )}
            <span>{warmup ? 'Warmup ✓' : 'Generating...'}</span>
          </button>
          <button
            onClick={() => cooldown && setShowCooldownDetail(!showCooldownDetail)}
            disabled={!cooldown}
            className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg text-xs transition-all ${
              cooldown
                ? 'bg-accent-600/20 text-accent-400 hover:bg-accent-600/30 cursor-pointer'
                : 'bg-void-100 text-zinc-500'
            }`}
          >
            {generatingWarmupCooldown && !cooldown ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <StretchHorizontal size={14} />
            )}
            <span>{cooldown ? 'Cooldown ✓' : 'Generating...'}</span>
          </button>
        </div>
      )}

      {/* Warmup detail view / timer */}
      {showWarmupDetail && warmup && (
        activeTimer === 'warmup' ? (
          <WorkoutTimer
            routine={warmup}
            title="Warmup"
            onClose={() => { setActiveTimer(null); setShowWarmupDetail(false) }}
            onComplete={() => setActiveTimer(null)}
          />
        ) : (
          <div className="bg-rose-900/20 border border-rose-700/30 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-rose-400 font-medium">Warmup</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTimer('warmup')}
                  className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/20 px-2 py-1 rounded-lg"
                >
                  <Timer size={12} />
                  Start Timer
                </button>
                <button
                  onClick={() => setShowWarmupDetail(false)}
                  className="text-xs text-zinc-500 hover:text-zinc-300"
                >
                  Hide
                </button>
              </div>
            </div>
            <div className="text-sm text-zinc-300 leading-relaxed max-h-32 overflow-y-auto">
              {warmup.split('\n').map((line, i) => (
                <p key={i} className={line.trim() ? 'mb-1' : 'mb-2'}>{line}</p>
              ))}
            </div>
          </div>
        )
      )}

      {/* Cooldown detail view / timer */}
      {showCooldownDetail && cooldown && (
        activeTimer === 'cooldown' ? (
          <WorkoutTimer
            routine={cooldown}
            title="Cooldown"
            onClose={() => { setActiveTimer(null); setShowCooldownDetail(false) }}
            onComplete={() => setActiveTimer(null)}
          />
        ) : (
          <div className="bg-accent-900/20 border border-accent-700/30 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-accent-400 font-medium">Cooldown</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTimer('cooldown')}
                  className="flex items-center gap-1 text-xs text-accent-400 hover:text-accent-300 bg-accent-500/20 px-2 py-1 rounded-lg"
                >
                  <Timer size={12} />
                  Start Timer
                </button>
                <button
                  onClick={() => setShowCooldownDetail(false)}
                  className="text-xs text-zinc-500 hover:text-zinc-300"
                >
                  Hide
                </button>
              </div>
            </div>
            <div className="text-sm text-zinc-300 leading-relaxed max-h-32 overflow-y-auto">
              {cooldown.split('\n').map((line, i) => (
                <p key={i} className={line.trim() ? 'mb-1' : 'mb-2'}>{line}</p>
              ))}
            </div>
          </div>
        )
      )}

      {/* Header */}
      <div className="text-center">
        {description && (
          <p className="text-sm text-zinc-400 mt-1">{description}</p>
        )}
        <div className="text-xs text-zinc-500 mt-2">
          {currentBlock?.type !== 'single'
            ? `${currentBlock?.type === 'superset' ? 'Superset' : 'Circuit'} ${currentBlockIndex + 1} of ${totalBlocks}`
            : `Exercise ${currentBlockIndex + 1} of ${totalBlocks}`
          }
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2.5 bg-void-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-rose-500 to-rose-400 transition-all duration-300 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Current exercise/block display */}
      {currentBlock && currentBlock.type === 'single' ? (
        <div className="p-6 rounded-2xl text-center bg-gradient-to-br from-rose-600 to-rose-700 relative">
          <div className="text-sm uppercase tracking-wider opacity-70 mb-1">Current</div>
          <div className="text-xl font-semibold mb-3 px-2 min-h-[3.5rem] flex items-center justify-center">
            {swappingIndex === currentBlock.originalIndices[0] ? (
              <Loader2 size={24} className="animate-spin opacity-70" />
            ) : (
              currentBlock.exercises[0]?.name
            )}
          </div>
          {(currentBlock.exercises[0]?.sets || currentBlock.exercises[0]?.reps) && (
            <div className="text-lg font-mono opacity-90">
              {currentBlock.exercises[0].sets && `${currentBlock.exercises[0].sets}×`}
              {currentBlock.exercises[0].reps || ''}
            </div>
          )}
          {(() => {
            const hist = exerciseHistory.get(currentBlock.exercises[0]?.name)
            return hist ? (
              <div className="text-xs opacity-60 mt-2">
                Last: {hist.daysAgo === 0 ? 'today' : `${hist.daysAgo}d ago`}
                {hist.lastWeight ? ` @ ${hist.lastWeight}kg` : ''}
              </div>
            ) : (
              <div className="text-xs opacity-50 mt-2">First time!</div>
            )
          })()}
          {/* Log weight/reps toggle */}
          <button
            onClick={() => setShowLogInput(!showLogInput)}
            className="mt-3 text-[10px] uppercase tracking-wider bg-white/15 hover:bg-white/25 px-3 py-1 rounded-lg transition-all"
          >
            {showLogInput ? 'Hide' : 'Log weight/reps'}
          </button>
          {showLogInput && (() => {
            const exIdx = currentBlock.originalIndices[0]
            const actual = exerciseActuals.get(exIdx) || { reps: [] }
            const numSets = currentBlock.exercises[0]?.sets || 3
            const hist = exerciseHistory.get(currentBlock.exercises[0]?.name)
            const weightDiff = actual.weight && hist?.lastWeight
              ? actual.weight - hist.lastWeight : null
            return (
              <div className="mt-3 bg-black/20 rounded-xl p-3 text-left space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider opacity-70 w-12">Weight</span>
                  <button
                    onClick={() => updateActualWeight(exIdx, (actual.weight || 0) - 2.5)}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold"
                  >-</button>
                  <span className="text-lg font-mono w-16 text-center">{actual.weight || 0}<span className="text-xs opacity-70">kg</span></span>
                  <button
                    onClick={() => updateActualWeight(exIdx, (actual.weight || 0) + 2.5)}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold"
                  >+</button>
                  {weightDiff !== null && weightDiff !== 0 && (
                    <span className={`text-xs font-medium ${weightDiff > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {weightDiff > 0 ? '+' : ''}{weightDiff}kg
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider opacity-70 w-12">Reps</span>
                  <div className="flex gap-1">
                    {Array.from({ length: numSets }, (_, s) => (
                      <input
                        key={s}
                        type="number"
                        inputMode="numeric"
                        value={actual.reps[s] || ''}
                        onChange={(e) => updateActualRep(exIdx, s, parseInt(e.target.value) || 0)}
                        placeholder={`S${s + 1}`}
                        className="w-12 h-8 rounded-lg bg-white/10 text-center text-sm font-mono border-none outline-none focus:bg-white/20"
                      />
                    ))}
                  </div>
                </div>
              </div>
            )
          })()}
          {onSwapExercise && (
            <button
              onClick={() => handleSwap(currentBlock.originalIndices[0])}
              disabled={swappingIndex !== null}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white/80 hover:text-white transition-all disabled:opacity-30"
              title="Swap exercise"
            >
              <RefreshCw size={14} className={swappingIndex === currentBlock.originalIndices[0] ? 'animate-spin' : ''} />
            </button>
          )}
        </div>
      ) : currentBlock && (
        <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-rose-600 to-rose-700 relative">
          <div className="px-4 pt-3 pb-1 flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider font-bold bg-white/20 px-2 py-0.5 rounded">
              {currentBlock.type === 'superset' ? 'SUPERSET' : 'CIRCUIT'}
            </span>
            <span className="text-xs opacity-70">{currentBlock.exercises.length} exercises</span>
          </div>
          <div className="px-4 pb-4 space-y-2">
            {currentBlock.exercises.map((ex, i) => (
              <div key={i} className="bg-black/15 rounded-xl p-3 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">
                    {swappingIndex === currentBlock.originalIndices[i] ? (
                      <Loader2 size={16} className="animate-spin inline opacity-70" />
                    ) : (
                      ex.name
                    )}
                  </div>
                  {(ex.sets || ex.reps) && (
                    <div className="text-xs font-mono opacity-80 mt-0.5">
                      {ex.sets && `${ex.sets}×`}{ex.reps || ''}
                    </div>
                  )}
                </div>
                {onSwapExercise && (
                  <button
                    onClick={() => handleSwap(currentBlock.originalIndices[i])}
                    disabled={swappingIndex !== null}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all disabled:opacity-30 ml-2"
                  >
                    <RefreshCw size={12} className={swappingIndex === currentBlock.originalIndices[i] ? 'animate-spin' : ''} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={handlePrevious}
          disabled={currentBlockIndex === 0}
          className="p-3 rounded-xl bg-void-100 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft size={24} />
        </button>

        <button
          onClick={isLastBlock ? handleDone : handleNext}
          className={`px-6 py-3 rounded-xl font-semibold shadow-lg transition-all flex items-center gap-2 ${
            isLastBlock
              ? 'bg-accent-500 text-white shadow-accent-500/30 hover:bg-accent-400'
              : 'bg-rose-500 text-white shadow-rose-500/30 hover:bg-rose-400'
          }`}
        >
          {isLastBlock ? (
            <>
              <Check size={20} />
              <span>Done</span>
            </>
          ) : (
            <>
              <span>Next</span>
              <ChevronRight size={20} />
            </>
          )}
        </button>
      </div>

      {/* Next/Previous block preview */}
      <div className="grid grid-cols-2 gap-2">
        {prevBlock && (
          <div className="bg-void-100 rounded-xl p-3 border border-violet-900/20">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-0.5">Previous</div>
            <div className="text-sm text-zinc-400 line-clamp-1">
              {prevBlock.type !== 'single'
                ? `${prevBlock.type === 'superset' ? 'SS' : 'Circuit'}: ${prevBlock.exercises.map(e => e.name).join(' + ')}`
                : prevBlock.exercises[0]?.name}
            </div>
          </div>
        )}
        {nextBlock && (
          <div className={`bg-void-100 rounded-xl p-3 border border-violet-900/20 ${!prevBlock ? 'col-span-2' : ''}`}>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-0.5">Next</div>
            <div className="text-sm text-zinc-300 line-clamp-1">
              {nextBlock.type !== 'single'
                ? `${nextBlock.type === 'superset' ? 'SS' : 'Circuit'}: ${nextBlock.exercises.map(e => e.name).join(' + ')}`
                : nextBlock.exercises[0]?.name}
            </div>
          </div>
        )}
      </div>

      {/* Block list indicator */}
      <div className="flex justify-center gap-1.5 flex-wrap">
        {blocks.map((block, i) => (
          <button
            key={i}
            onClick={() => setCurrentBlockIndex(i)}
            className={`h-2 rounded-full transition-all ${
              i === currentBlockIndex
                ? 'bg-rose-500 w-4'
                : completedBlocks.has(i)
                ? 'bg-accent-500 w-2'
                : 'bg-zinc-700 w-2'
            } ${block.type !== 'single' ? 'ring-1 ring-amber-500/50' : ''}`}
          />
        ))}
      </div>

      {/* Footer actions */}
      <div className="flex gap-2">
        <button
          onClick={handleRestart}
          className="flex-1 btn-secondary flex items-center justify-center gap-2 py-2.5"
        >
          <RotateCcw size={16} />
          <span className="text-sm">Restart</span>
        </button>
        <button
          onClick={onClose}
          className="flex-1 btn-secondary py-2.5 text-sm"
        >
          Close
        </button>
      </div>
    </div>
  )
}
