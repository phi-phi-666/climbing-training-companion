import { useState, useEffect } from 'react'
import { generateWarmup, buildAIContext } from '../services/ai'
import { useSessionHistory } from '../hooks/useSessionHistory'
import { useTodayNutrition } from '../hooks/useNutrition'
import type { Session } from '../services/db'

interface WarmupGeneratorProps {
  sessionType: Session['type']
  onClose: () => void
  onWarmupGenerated?: (warmup: string) => void
  savedWarmup?: string | null
}

export default function WarmupGenerator({
  sessionType,
  onClose,
  onWarmupGenerated,
  savedWarmup
}: WarmupGeneratorProps) {
  const [warmup, setWarmup] = useState<string | null>(savedWarmup ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const lastSessions = useSessionHistory(7)
  const todayNutrition = useTodayNutrition()

  useEffect(() => {
    if (savedWarmup) {
      setWarmup(savedWarmup)
    }
  }, [savedWarmup])

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)

    try {
      const context = buildAIContext(lastSessions, todayNutrition)
      const result = await generateWarmup(sessionType, context)
      setWarmup(result)
      onWarmupGenerated?.(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate warmup')
    } finally {
      setLoading(false)
    }
  }

  const sessionTypeLabels: Record<Session['type'], string> = {
    boulder: 'Bouldering',
    lead: 'Lead Climbing',
    hangboard: 'Hangboard',
    supplementary: 'Supplementary'
  }

  return (
    <div className="space-y-4">
      {!warmup && !loading && (
        <div className="text-center py-4">
          <p className="text-gray-300 mb-4">
            Generate an AI-powered warmup routine tailored for your{' '}
            <span className="font-semibold text-indigo-400">
              {sessionTypeLabels[sessionType]}
            </span>{' '}
            session based on your recent training history.
          </p>
          <button
            onClick={handleGenerate}
            className="btn-primary px-8"
            disabled={loading}
          >
            Generate Warmup
          </button>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-400">Generating your warmup...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={handleGenerate}
            className="mt-3 text-sm text-red-300 underline"
          >
            Try again
          </button>
        </div>
      )}

      {warmup && (
        <div className="space-y-4">
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-sm leading-relaxed">
              {warmup.split('\n').map((line, i) => (
                <p key={i} className={line.trim() ? 'mb-2' : 'mb-4'}>
                  {line}
                </p>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Regenerate
            </button>
            <button onClick={onClose} className="btn-primary flex-1">
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
