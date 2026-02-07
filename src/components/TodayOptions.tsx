import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  generateTodayOptions,
  buildAIContext,
  type TodayOption,
  type DaysSinceByType
} from '../services/ai'
import { useSessionHistory } from '../hooks/useSessionHistory'
import { sessionTypes } from '../data/exercises'
import {
  Mountain,
  Dumbbell,
  Hand,
  Flame,
  Footprints,
  Zap,
  StretchHorizontal,
  RefreshCw,
  Play,
  X,
  Sparkles,
  type LucideIcon
} from 'lucide-react'

// Icon mapping for session types
const sessionIcons: Record<string, LucideIcon> = {
  boulder: Mountain,
  lead: Mountain,
  hangboard: Hand,
  gym: Dumbbell,
  cardio: Footprints,
  hiit: Flame,
  crossfit: Zap,
  mobility: StretchHorizontal
}

interface TodayOptionsProps {
  daysSince: DaysSinceByType
  hasSessionToday: boolean
}

const STORAGE_KEY = 'alpha_selected_option'

export default function TodayOptions({ daysSince, hasSessionToday }: TodayOptionsProps) {
  const navigate = useNavigate()
  const [options, setOptions] = useState<TodayOption[] | null>(null)
  const [selectedOption, setSelectedOption] = useState<TodayOption | null>(() => {
    // Restore from localStorage on mount
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Check if stored option is from today
        const storedDate = parsed._storedDate
        const today = new Date().toISOString().split('T')[0]
        if (storedDate === today) {
          delete parsed._storedDate
          return parsed
        }
        // Clear stale options from previous days
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      // Ignore parsing errors
    }
    return null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const lastSessions = useSessionHistory(7)

  // Persist selectedOption to localStorage
  useEffect(() => {
    if (selectedOption) {
      const toStore = {
        ...selectedOption,
        _storedDate: new Date().toISOString().split('T')[0]
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [selectedOption])

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    setSelectedOption(null)

    try {
      const context = buildAIContext(lastSessions, null)
      console.log('Generating options with context:', context, 'daysSince:', daysSince)
      const result = await generateTodayOptions(context, daysSince)
      console.log('Generated options:', result)
      if (!result || result.length === 0) {
        setError('No options returned from AI')
      } else {
        setOptions(result)
      }
    } catch (err) {
      console.error('Error generating options:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate options')
    } finally {
      setLoading(false)
    }
  }

  const effortColors: Record<string, string> = {
    high: 'from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600',
    medium: 'from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600',
    low: 'from-accent-600 to-accent-700 hover:from-accent-500 hover:to-accent-600'
  }

  const effortLabels: Record<string, string> = {
    high: 'High',
    medium: 'Medium',
    low: 'Low'
  }

  const handleSelectOption = (option: TodayOption) => {
    setSelectedOption(option)
  }

  const handleStartTraining = () => {
    if (!selectedOption) return

    // Navigate to log with pre-populated data
    navigate('/log', {
      state: {
        prefill: selectedOption
      }
    })
  }

  const handleClearSelection = () => {
    setSelectedOption(null)
  }

  const getSessionTypeLabel = (type: string) => {
    return sessionTypes.find(t => t.value === type)?.label || type
  }

  // Show "already trained" message if session logged today
  if (hasSessionToday && !options && !selectedOption) {
    return (
      <div className="card">
        <div className="bg-accent-900/20 border border-accent-700/30 rounded-xl p-5 text-center">
          <span className="text-3xl mb-2 block">✓</span>
          <p className="text-accent-400 font-semibold">Already trained today</p>
          <p className="text-zinc-500 text-sm mt-1">Rest up for tomorrow</p>
        </div>
      </div>
    )
  }

  // Show selected option with Start Training button
  if (selectedOption) {
    const Icon = sessionIcons[selectedOption.sessionType] || Dumbbell

    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl tracking-wide">TODAY'S PLAN</h2>
          <div className="flex gap-1">
            <button
              onClick={handleGenerate}
              className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors rounded-lg hover:bg-void-50"
              title="Generate new options"
            >
              <RefreshCw size={16} strokeWidth={1.5} />
            </button>
            <button
              onClick={handleClearSelection}
              className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors rounded-lg hover:bg-void-50"
              title="Clear selection"
            >
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <div className={`p-4 rounded-xl bg-gradient-to-br ${effortColors[selectedOption.effort]} mb-4`}>
          <div className="flex items-start gap-3">
            <div className="bg-black/20 p-2 rounded-lg">
              <Icon size={24} strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold">{selectedOption.title}</span>
                <span className="text-[10px] uppercase tracking-wider opacity-75 bg-black/20 px-2 py-0.5 rounded">
                  {effortLabels[selectedOption.effort]}
                </span>
              </div>
              <p className="text-sm opacity-90 mb-2">{selectedOption.description}</p>
              <div className="text-xs opacity-80">
                <span className="font-medium">{getSessionTypeLabel(selectedOption.sessionType)}</span>
                {selectedOption.boulderSubType && <span> • {selectedOption.boulderSubType}</span>}
                {selectedOption.cardioSubType && <span> • {selectedOption.cardioSubType}</span>}
                <span> • {selectedOption.durationMinutes} min</span>
              </div>
            </div>
          </div>

          {/* Exercises preview */}
          <div className="mt-4 pt-3 border-t border-white/10">
            <div className="text-[10px] uppercase tracking-wider font-medium opacity-60 mb-2">Exercises</div>
            <div className="space-y-1">
              {selectedOption.exercises.map((ex, i) => (
                <div key={i} className="text-sm flex justify-between">
                  <span className="opacity-90">{ex.name}</span>
                  <span className="opacity-60 text-xs">
                    {ex.sets && `${ex.sets}×`}{ex.reps || ''}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recovery notes */}
          {selectedOption.recoveryNotes && (
            <div className="mt-3 pt-3 border-t border-white/10 text-sm opacity-70 italic">
              {selectedOption.recoveryNotes}
            </div>
          )}
        </div>

        <button
          onClick={handleStartTraining}
          className="w-full btn-primary flex items-center justify-center gap-2 py-4"
        >
          <Play size={18} strokeWidth={2} />
          <span className="font-semibold tracking-wide">Start Training</span>
        </button>
      </div>
    )
  }

  // Initial state - just the button, no description
  if (!options && !loading) {
    return (
      <div className="card">
        <button
          onClick={handleGenerate}
          className="w-full btn-primary-glow flex items-center justify-center gap-3 py-4"
          disabled={loading}
        >
          <Sparkles size={20} strokeWidth={1.5} />
          <span className="font-semibold tracking-wide">What's Next?</span>
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-zinc-500 text-sm">Analyzing your training...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card">
        <div className="bg-red-900/20 border border-red-800/30 rounded-xl p-4 mb-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
        <button onClick={handleGenerate} className="btn-secondary w-full">
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl tracking-wide">TODAY'S OPTIONS</h2>
        <button
          onClick={handleGenerate}
          className="p-2 text-rose-400 hover:text-rose-300 transition-colors rounded-lg hover:bg-void-50"
          disabled={loading}
          title="Refresh options"
        >
          <RefreshCw size={16} strokeWidth={1.5} />
        </button>
      </div>

      <div className="space-y-2">
        {options?.map((option, index) => {
          const Icon = sessionIcons[option.sessionType] || Dumbbell
          return (
            <button
              key={index}
              onClick={() => handleSelectOption(option)}
              className={`w-full p-4 rounded-xl bg-gradient-to-r ${effortColors[option.effort]} transition-all text-left shadow-lg hover:scale-[1.01] active:scale-[0.99]`}
            >
              <div className="flex items-start gap-3">
                <div className="bg-black/20 p-2 rounded-lg">
                  <Icon size={20} strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{option.title}</span>
                    <span className="text-[10px] uppercase tracking-wider opacity-75 bg-black/20 px-2 py-0.5 rounded">
                      {effortLabels[option.effort]}
                    </span>
                  </div>
                  <p className="text-sm opacity-90 mb-1">{option.description}</p>
                  <div className="flex items-center gap-2 text-xs opacity-70">
                    <span>{getSessionTypeLabel(option.sessionType)}</span>
                    <span>•</span>
                    <span>{option.durationMinutes} min</span>
                    <span>•</span>
                    <span>{option.exercises.length} exercises</span>
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
