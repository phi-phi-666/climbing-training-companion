import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  generateTodayOptions,
  buildAIContext,
  type TodayOption,
  type DaysSinceByType
} from '../services/ai'
import { useSessionHistory } from '../hooks/useSessionHistory'
import { useTodayNutrition } from '../hooks/useNutrition'

interface TodayOptionsProps {
  daysSince: DaysSinceByType
}

export default function TodayOptions({ daysSince }: TodayOptionsProps) {
  const navigate = useNavigate()
  const [options, setOptions] = useState<TodayOption[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const lastSessions = useSessionHistory(7)
  const todayNutrition = useTodayNutrition()

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)

    try {
      const context = buildAIContext(lastSessions, todayNutrition)
      const result = await generateTodayOptions(context, daysSince)
      setOptions(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate options')
    } finally {
      setLoading(false)
    }
  }

  const effortColors: Record<string, string> = {
    high: 'from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500',
    medium: 'from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500',
    low: 'from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500'
  }

  const effortEmoji: Record<string, string> = {
    high: '🔥',
    medium: '💪',
    low: '🧘'
  }

  const effortLabels: Record<string, string> = {
    high: 'High Effort',
    medium: 'Medium Effort',
    low: 'Recovery'
  }

  const handleOptionClick = (_option: TodayOption) => {
    // Navigate to log session - could pre-populate based on option in future
    navigate('/log')
  }

  if (!options && !loading) {
    return (
      <div className="card">
        <h2 className="text-lg font-semibold mb-3">What Should I Do Today?</h2>
        <p className="text-gray-400 text-sm mb-4">
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
        <div className="text-center py-6">
          <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-gray-400 text-sm">Analyzing your training...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card">
        <h2 className="text-lg font-semibold mb-3">What Should I Do Today?</h2>
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-3">
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
          className="text-sm text-indigo-400 hover:text-indigo-300"
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        {options?.map((option, index) => (
          <button
            key={index}
            onClick={() => handleOptionClick(option)}
            className={`w-full p-4 rounded-lg bg-gradient-to-r ${effortColors[option.effort]} transition-all text-left`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{effortEmoji[option.effort]}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{option.title}</span>
                  <span className="text-xs opacity-75 bg-black/20 px-2 py-0.5 rounded">
                    {effortLabels[option.effort]}
                  </span>
                </div>
                <p className="text-sm opacity-90 mb-2">{option.description}</p>
                <div className="flex flex-wrap gap-1">
                  {option.exercises.slice(0, 4).map((exercise, i) => (
                    <span
                      key={i}
                      className="text-xs bg-black/20 px-2 py-0.5 rounded"
                    >
                      {exercise}
                    </span>
                  ))}
                  {option.exercises.length > 4 && (
                    <span className="text-xs opacity-75">
                      +{option.exercises.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
