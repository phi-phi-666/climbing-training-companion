import { useState } from 'react'
import { ChevronLeft, ChevronRight, Check, RotateCcw, Loader2, Sparkles, StretchHorizontal, RefreshCw } from 'lucide-react'

interface Exercise {
  name: string
  sets?: number
  reps?: string
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
  const [currentIndex, setCurrentIndex] = useState(0)
  const [completedExercises, setCompletedExercises] = useState<Set<number>>(new Set())
  const [showWarmupDetail, setShowWarmupDetail] = useState(false)
  const [showCooldownDetail, setShowCooldownDetail] = useState(false)
  const [swappingIndex, setSwappingIndex] = useState<number | null>(null)

  const currentExercise = exercises[currentIndex]
  const nextExercise = exercises[currentIndex + 1]
  const prevExercise = exercises[currentIndex - 1]
  const totalExercises = exercises.length
  const progress = ((currentIndex + 1) / totalExercises) * 100

  const handleNext = () => {
    // Mark current as completed
    setCompletedExercises(prev => new Set(prev).add(currentIndex))

    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  const handleDone = () => {
    // Build notes text from exercises
    const notesText = exercises
      .map(ex => {
        let line = ex.name
        if (ex.sets && ex.reps) {
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
    setCurrentIndex(0)
    setCompletedExercises(new Set())
  }

  const isLastExercise = currentIndex === exercises.length - 1

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

      {/* Warmup detail view */}
      {showWarmupDetail && warmup && (
        <div className="bg-rose-900/20 border border-rose-700/30 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider text-rose-400 font-medium">Warmup</span>
            <button
              onClick={() => setShowWarmupDetail(false)}
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              Hide
            </button>
          </div>
          <div className="text-sm text-zinc-300 leading-relaxed max-h-32 overflow-y-auto">
            {warmup.split('\n').map((line, i) => (
              <p key={i} className={line.trim() ? 'mb-1' : 'mb-2'}>{line}</p>
            ))}
          </div>
        </div>
      )}

      {/* Cooldown detail view */}
      {showCooldownDetail && cooldown && (
        <div className="bg-accent-900/20 border border-accent-700/30 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider text-accent-400 font-medium">Cooldown</span>
            <button
              onClick={() => setShowCooldownDetail(false)}
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              Hide
            </button>
          </div>
          <div className="text-sm text-zinc-300 leading-relaxed max-h-32 overflow-y-auto">
            {cooldown.split('\n').map((line, i) => (
              <p key={i} className={line.trim() ? 'mb-1' : 'mb-2'}>{line}</p>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center">
        {description && (
          <p className="text-sm text-zinc-400 mt-1">{description}</p>
        )}
        <div className="text-xs text-zinc-500 mt-2">
          Exercise {currentIndex + 1} of {totalExercises}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2.5 bg-void-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-rose-500 to-rose-400 transition-all duration-300 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Current exercise display */}
      <div className="p-6 rounded-2xl text-center bg-gradient-to-br from-rose-600 to-rose-700 relative">
        <div className="text-sm uppercase tracking-wider opacity-70 mb-1">Current</div>
        <div className="text-xl font-semibold mb-3 px-2 min-h-[3.5rem] flex items-center justify-center">
          {swappingIndex === currentIndex ? (
            <Loader2 size={24} className="animate-spin opacity-70" />
          ) : (
            currentExercise?.name
          )}
        </div>
        {(currentExercise?.sets || currentExercise?.reps) && (
          <div className="text-lg font-mono opacity-90">
            {currentExercise.sets && `${currentExercise.sets}×`}
            {currentExercise.reps || ''}
          </div>
        )}
        {onSwapExercise && (
          <button
            onClick={() => handleSwap(currentIndex)}
            disabled={swappingIndex !== null}
            className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white/80 hover:text-white transition-all disabled:opacity-30"
            title="Swap exercise"
          >
            <RefreshCw size={14} className={swappingIndex === currentIndex ? 'animate-spin' : ''} />
          </button>
        )}
      </div>

      {/* Navigation controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="p-3 rounded-xl bg-void-100 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft size={24} />
        </button>

        <button
          onClick={isLastExercise ? handleDone : handleNext}
          className={`px-6 py-3 rounded-xl font-semibold shadow-lg transition-all flex items-center gap-2 ${
            isLastExercise
              ? 'bg-accent-500 text-white shadow-accent-500/30 hover:bg-accent-400'
              : 'bg-rose-500 text-white shadow-rose-500/30 hover:bg-rose-400'
          }`}
        >
          {isLastExercise ? (
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

      {/* Next/Previous exercise preview */}
      <div className="grid grid-cols-2 gap-2">
        {prevExercise && (
          <div className="bg-void-100 rounded-xl p-3 border border-violet-900/20">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-0.5">Previous</div>
            <div className="text-sm text-zinc-400 line-clamp-1">{prevExercise.name}</div>
          </div>
        )}
        {nextExercise && (
          <div className={`bg-void-100 rounded-xl p-3 border border-violet-900/20 ${!prevExercise ? 'col-span-2' : ''}`}>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-0.5">Next</div>
            <div className="text-sm text-zinc-300 line-clamp-1">{nextExercise.name}</div>
          </div>
        )}
      </div>

      {/* Exercise list indicator */}
      <div className="flex justify-center gap-1.5 flex-wrap">
        {exercises.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`w-2 h-2 rounded-full transition-all ${
              i === currentIndex
                ? 'bg-rose-500 w-4'
                : completedExercises.has(i)
                ? 'bg-accent-500'
                : 'bg-zinc-700'
            }`}
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
