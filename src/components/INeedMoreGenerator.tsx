import { useState } from 'react'
import { generateINeedMore, buildAIContext, type INeedMoreResult, type WorkoutType } from '../services/ai'
import { useSessionHistory } from '../hooks/useSessionHistory'
import type { SessionType, BoulderSubType } from '../data/exercises'
import { RefreshCw, Loader2, Play, AlertTriangle, Check } from 'lucide-react'
import WorkoutPreview from './WorkoutPreview'

type Duration = 15 | 30 | 45

interface INeedMoreGeneratorProps {
  sessionType: SessionType
  boulderSubType?: BoulderSubType
  onClose: () => void
  onWorkoutGenerated?: (notesText: string) => void
}

const WORKOUT_OPTIONS: { value: WorkoutType; label: string; description: string }[] = [
  { value: 'antagonist', label: 'Antagonist', description: 'Balance pulling with pushing' },
  { value: 'supplementary', label: 'Extra Volume', description: 'Add training volume' },
  { value: 'core', label: 'Core', description: 'Injury prevention & performance' }
]

export default function INeedMoreGenerator({
  sessionType,
  boulderSubType,
  onClose,
  onWorkoutGenerated
}: INeedMoreGeneratorProps) {
  const lastSessions = useSessionHistory(7)

  // Multi-select for workout types
  const [selectedTypes, setSelectedTypes] = useState<WorkoutType[]>(() => {
    // Smart defaults: after climbing, default to antagonist + core
    if (sessionType === 'boulder' || sessionType === 'lead' || sessionType === 'hangboard') {
      return ['antagonist', 'core']
    }
    return ['core']
  })

  const [duration, setDuration] = useState<Duration>(15)
  const [result, setResult] = useState<INeedMoreResult | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if this is a climbing session (for supplementary warning)
  const isClimbingSession = sessionType === 'boulder' || sessionType === 'lead' || sessionType === 'hangboard'

  const toggleType = (type: WorkoutType) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const handleGenerate = async () => {
    if (selectedTypes.length === 0) return

    setLoading(true)
    setError(null)

    try {
      const context = buildAIContext(lastSessions, null)
      const generated = await generateINeedMore(
        sessionType,
        context,
        selectedTypes,
        duration,
        boulderSubType
      )
      setResult(generated)
    } catch (err) {
      console.error('Error generating workout:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate')
    } finally {
      setLoading(false)
    }
  }

  const handleStartWorkout = () => {
    if (!result) return
    setShowPreview(true)
  }

  const handlePreviewComplete = (notesText: string) => {
    if (!result) return
    // Build full notes with title and description
    const fullNotes = `${result.title}\n${result.description}\n\n${notesText}${result.notes ? '\n\n' + result.notes : ''}`
    onWorkoutGenerated?.(fullNotes)
    onClose()
  }

  // Show workout preview if started
  if (showPreview && result) {
    return (
      <WorkoutPreview
        description={result.description}
        exercises={result.exercises}
        onClose={() => setShowPreview(false)}
        onComplete={handlePreviewComplete}
      />
    )
  }

  return (
    <div className="space-y-4">
      {!result ? (
        <>
          {/* Workout Type Selection (Multi-select) */}
          <div>
            <div className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">What do you want?</div>
            <div className="space-y-2">
              {WORKOUT_OPTIONS.map((option) => {
                const isSelected = selectedTypes.includes(option.value)
                const showWarning = option.value === 'supplementary' && isClimbingSession && isSelected

                return (
                  <button
                    key={option.value}
                    onClick={() => toggleType(option.value)}
                    className={`w-full p-3 rounded-xl text-left transition-all border flex items-center justify-between ${
                      isSelected
                        ? 'bg-rose-500/20 border-rose-500/50'
                        : 'bg-void-100 hover:bg-void-50 border-violet-900/20'
                    }`}
                  >
                    <div>
                      <div className={`font-semibold text-sm ${isSelected ? 'text-rose-300' : ''}`}>
                        {option.label}
                      </div>
                      <div className="text-[10px] text-zinc-500">{option.description}</div>
                      {showWarning && (
                        <div className="flex items-center gap-1 mt-1 text-amber-400 text-[10px]">
                          <AlertTriangle size={10} />
                          <span>Risk of overtraining - only if feeling fresh</span>
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <Check size={18} className="text-rose-400" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Duration Selection */}
          <div>
            <div className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Duration</div>
            <div className="flex gap-2">
              {([15, 30, 45] as Duration[]).map((dur) => (
                <button
                  key={dur}
                  onClick={() => setDuration(dur)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                    duration === dur
                      ? 'bg-rose-500 text-white'
                      : 'bg-void-100 text-zinc-400 hover:text-zinc-200 border border-violet-900/20'
                  }`}
                >
                  {dur} min
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-800/30 rounded-xl p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={loading || selectedTypes.length === 0}
            className="w-full btn-primary flex items-center justify-center gap-2 py-3 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <span>Generate Workout</span>
            )}
          </button>

          <button
            onClick={onClose}
            className="w-full text-zinc-500 hover:text-zinc-300 text-sm py-2 transition-colors"
          >
            Cancel
          </button>
        </>
      ) : (
        <>
          {/* Result Display */}
          <div className="bg-gradient-to-br from-amber-600/20 to-orange-600/20 border border-amber-500/30 rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-semibold text-lg">{result.title}</div>
                <div className="text-sm text-zinc-400">{result.description}</div>
              </div>
              <div className="text-xs bg-amber-500/30 px-2 py-1 rounded">
                {duration} min
              </div>
            </div>

            {/* Muscle Groups */}
            {result.muscleGroups.length > 0 && (
              <div className="mb-3">
                <div className="text-[10px] uppercase tracking-wider text-amber-400/70 mb-1">Targets</div>
                <div className="flex flex-wrap gap-1">
                  {result.muscleGroups.map((group, i) => (
                    <span key={i} className="text-xs bg-void-100 px-2 py-0.5 rounded">
                      {group}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Exercises */}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-amber-400/70 mb-2">Exercises</div>
              <div className="space-y-2">
                {result.exercises.map((ex, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="text-zinc-200">{ex.name}</span>
                    <span className="text-zinc-500 text-xs">
                      {ex.sets && `${ex.sets}×`}{ex.reps || ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {result.notes && (
              <div className="mt-3 pt-3 border-t border-amber-500/20 text-sm text-amber-300/80 italic">
                {result.notes}
              </div>
            )}
          </div>

          {/* Actions */}
          <button
            onClick={handleStartWorkout}
            className="w-full btn-primary flex items-center justify-center gap-2 py-4"
          >
            <Play size={18} strokeWidth={2} />
            <span className="font-semibold tracking-wide">Start Workout</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex-1 btn-secondary flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RefreshCw size={16} />
              )}
              <span>Regenerate</span>
            </button>
            <button
              onClick={() => setResult(null)}
              className="flex-1 btn-secondary"
            >
              Change Options
            </button>
          </div>
        </>
      )}
    </div>
  )
}
