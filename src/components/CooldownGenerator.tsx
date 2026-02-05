import { useState, useEffect } from 'react'
import { generateCooldown, buildAIContext } from '../services/ai'
import { useSessionHistory } from '../hooks/useSessionHistory'
import { sessionTypes } from '../data/exercises'
import type { Session } from '../services/db'

interface CooldownGeneratorProps {
  sessionType: Session['type']
  onClose: () => void
  onCooldownGenerated?: (cooldown: string) => void
  savedCooldown?: string | null
  muscleGroups?: string[]
  exercises?: string[]
}

export default function CooldownGenerator({
  sessionType,
  onClose,
  onCooldownGenerated,
  savedCooldown,
  muscleGroups,
  exercises
}: CooldownGeneratorProps) {
  const [cooldown, setCooldown] = useState<string | null>(savedCooldown ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const lastSessions = useSessionHistory(7)

  useEffect(() => {
    if (savedCooldown) {
      setCooldown(savedCooldown)
    }
  }, [savedCooldown])

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)

    try {
      const context = buildAIContext(lastSessions, null)
      const result = await generateCooldown(sessionType, context, muscleGroups, exercises)
      setCooldown(result)
      onCooldownGenerated?.(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate cooldown')
    } finally {
      setLoading(false)
    }
  }

  const getSessionLabel = () => {
    const type = sessionTypes.find(t => t.value === sessionType)
    return type?.label || sessionType
  }

  const hasMuscleGroups = muscleGroups && muscleGroups.length > 0

  return (
    <div className="space-y-4">
      {!cooldown && !loading && (
        <div className="text-center py-4">
          <p className="text-stone-300 mb-4">
            Generate an AI-powered cooldown routine tailored for your{' '}
            <span className="font-semibold text-accent-400">
              {getSessionLabel()}
            </span>{' '}
            session to aid recovery.
          </p>
          {hasMuscleGroups && (
            <p className="text-stone-500 text-sm mb-4">
              Targeting: {muscleGroups.join(', ')}
            </p>
          )}
          <button
            onClick={handleGenerate}
            className="btn-primary px-8"
            disabled={loading}
          >
            Generate Cooldown
          </button>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-stone-400">Generating your cooldown...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={handleGenerate}
            className="mt-3 text-sm text-red-300 underline"
          >
            Try again
          </button>
        </div>
      )}

      {cooldown && (
        <div className="space-y-4">
          <div className="bg-stone-800 rounded-xl p-4 border border-stone-700">
            <div className="text-sm leading-relaxed text-stone-200">
              {cooldown.split('\n').map((line, i) => (
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
