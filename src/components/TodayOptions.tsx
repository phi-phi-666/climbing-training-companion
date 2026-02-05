import { useState } from 'react'
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

export default function TodayOptions({ daysSince, hasSessionToday }: TodayOptionsProps) {
  const navigate = useNavigate()
  const [options, setOptions] = useState<TodayOption[] | null>(null)
  const [selectedOption, setSelectedOption] = useState<TodayOption | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const lastSessions = useSessionHistory(7)

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
    high: 'from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500',
    medium: 'from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500',
    low: 'from-accent-600 to-teal-600 hover:from-accent-500 hover:to-teal-500'
  }

  const effortLabels: Record<string, string> = {
    high: 'High Effort',
    medium: 'Medium Effort',
    low: 'Recovery'
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
        <h2 className="text-lg font-semibold mb-3">What Should I Do Today?</h2>
        <div className="bg-accent-900/30 border border-accent-700 rounded-xl p-5 text-center">
          <span className="text-4xl mb-2 block">✅</span>
          <p className="text-accent-400 font-semibold text-lg">Already trained today!</p>
          <p className="text-stone-500 text-sm mt-1">Nice work. Rest up for tomorrow.</p>
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
          <h2 className="text-lg font-semibold">Today's Plan</h2>
          <div className="flex gap-2">
            <button
              onClick={handleGenerate}
              className="p-2 text-stone-400 hover:text-stone-200 transition-colors"
              title="Generate new options"
            >
              <RefreshCw size={18} strokeWidth={1.5} />
            </button>
            <button
              onClick={handleClearSelection}
              className="p-2 text-stone-400 hover:text-stone-200 transition-colors"
              title="Clear selection"
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <div className={`p-4 rounded-xl bg-gradient-to-r ${effortColors[selectedOption.effort]} mb-4`}>
          <div className="flex items-start gap-3">
            <div className="bg-black/20 p-2 rounded-lg">
              <Icon size={28} strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-lg">{selectedOption.title}</span>
                <span className="text-xs opacity-75 bg-black/20 px-2 py-0.5 rounded-lg">
                  {effortLabels[selectedOption.effort]}
                </span>
              </div>
              <p className="text-sm opacity-90 mb-2">{selectedOption.description}</p>
              <div className="text-sm opacity-80">
                <span className="font-medium">{getSessionTypeLabel(selectedOption.sessionType)}</span>
                {selectedOption.boulderSubType && <span> • {selectedOption.boulderSubType}</span>}
                {selectedOption.cardioSubType && <span> • {selectedOption.cardioSubType}</span>}
                <span> • {selectedOption.durationMinutes} min</span>
              </div>
            </div>
          </div>

          {/* Exercises preview */}
          <div className="mt-4 pt-3 border-t border-white/20">
            <div className="text-xs font-medium opacity-75 mb-2">Exercises:</div>
            <div className="space-y-1">
              {selectedOption.exercises.map((ex, i) => (
                <div key={i} className="text-sm flex justify-between">
                  <span>{ex.name}</span>
                  <span className="opacity-75">
                    {ex.sets && `${ex.sets}×`}{ex.reps || ''}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recovery notes */}
          {selectedOption.recoveryNotes && (
            <div className="mt-3 pt-3 border-t border-white/20 text-sm opacity-80 italic">
              💡 {selectedOption.recoveryNotes}
            </div>
          )}
        </div>

        <button
          onClick={handleStartTraining}
          className="w-full btn-primary flex items-center justify-center gap-2 text-lg py-4"
        >
          <Play size={20} strokeWidth={2} />
          <span>Start Training</span>
        </button>
      </div>
    )
  }

  if (!options && !loading) {
    return (
      <div className="card">
        <h2 className="text-lg font-semibold mb-3">What Should I Do Today?</h2>
        <p className="text-stone-500 text-sm mb-4">
          Get AI-powered training suggestions based on your schedule and recovery
        </p>
        <button
          onClick={handleGenerate}
          className="w-full btn-primary flex items-center justify-center gap-2"
          disabled={loading}
        >
          <span>✨</span>
          <span>Generate Today's Options</span>
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">What Should I Do Today?</h2>
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-stone-500 text-sm">Analyzing your training...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card">
        <h2 className="text-lg font-semibold mb-3">What Should I Do Today?</h2>
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 mb-3">
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
        <h2 className="text-lg font-semibold">Today's Options</h2>
        <button
          onClick={handleGenerate}
          className="p-2 text-rose-400 hover:text-rose-300 transition-colors"
          disabled={loading}
          title="Refresh options"
        >
          <RefreshCw size={18} strokeWidth={1.5} />
        </button>
      </div>

      <div className="space-y-3">
        {options?.map((option, index) => {
          const Icon = sessionIcons[option.sessionType] || Dumbbell
          return (
            <button
              key={index}
              onClick={() => handleSelectOption(option)}
              className={`w-full p-4 rounded-xl bg-gradient-to-r ${effortColors[option.effort]} transition-all text-left shadow-lg`}
            >
              <div className="flex items-start gap-3">
                <div className="bg-black/20 p-2 rounded-lg">
                  <Icon size={24} strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{option.title}</span>
                    <span className="text-xs opacity-75 bg-black/20 px-2 py-0.5 rounded-lg">
                      {effortLabels[option.effort]}
                    </span>
                  </div>
                  <p className="text-sm opacity-90 mb-2">{option.description}</p>
                  <div className="flex items-center gap-2 text-xs opacity-75">
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
