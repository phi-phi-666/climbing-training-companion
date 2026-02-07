import { useState } from 'react'
import { generateSupplementary, buildAIContext } from '../services/ai'
import { useSessionHistory } from '../hooks/useSessionHistory'
import type { SessionType, BoulderSubType } from '../data/exercises'
import { RefreshCw, Loader2, Check } from 'lucide-react'

interface SupplementaryGeneratorProps {
  sessionType: SessionType
  boulderSubType?: BoulderSubType
  onClose: () => void
  onSupplementaryGenerated: (supplementary: string) => void
  savedSupplementary: string | null
}

export default function SupplementaryGenerator({
  sessionType,
  boulderSubType,
  onClose,
  onSupplementaryGenerated,
  savedSupplementary
}: SupplementaryGeneratorProps) {
  const [supplementary, setSupplementary] = useState<string | null>(savedSupplementary)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const lastSessions = useSessionHistory(7)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)

    try {
      const context = buildAIContext(lastSessions, null)
      const result = await generateSupplementary(
        sessionType,
        context,
        sessionType === 'boulder' ? boulderSubType : undefined
      )
      setSupplementary(result)
      onSupplementaryGenerated(result)
    } catch (err) {
      console.error('Error generating supplementary exercises:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate')
    } finally {
      setLoading(false)
    }
  }

  const handleUse = () => {
    if (supplementary) {
      onSupplementaryGenerated(supplementary)
      onClose()
    }
  }

  // Get session-specific description
  const getDescription = () => {
    switch (sessionType) {
      case 'boulder':
      case 'lead':
      case 'hangboard':
        return 'Antagonist exercises to balance your pulling work - pushing movements, external rotation, and wrist extensors.'
      case 'gym':
      case 'crossfit':
      case 'hiit':
        return 'Supplementary work to complement your strength session.'
      default:
        return 'Extra exercises to round out your training.'
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-400">
        {getDescription()}
      </p>

      {error && (
        <div className="bg-red-900/20 border border-red-800/30 rounded-xl p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {supplementary ? (
        <div className="space-y-3">
          <div className="bg-amber-950/30 border border-amber-800/30 rounded-xl p-4">
            <div className="text-[10px] uppercase tracking-wider text-amber-400 font-medium mb-3">
              Supplementary Exercises
            </div>
            <div className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
              {supplementary}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex-1 btn-secondary flex items-center justify-center gap-2 py-2.5"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RefreshCw size={16} />
              )}
              <span className="text-sm">Regenerate</span>
            </button>
            <button
              onClick={handleUse}
              className="flex-1 btn-primary flex items-center justify-center gap-2 py-2.5"
            >
              <Check size={16} />
              <span className="text-sm">Use This</span>
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full btn-primary flex items-center justify-center gap-2 py-3"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <span>Generate Bonus Workout</span>
          )}
        </button>
      )}

      <button
        onClick={onClose}
        className="w-full text-zinc-500 hover:text-zinc-300 text-sm py-2 transition-colors"
      >
        Cancel
      </button>
    </div>
  )
}
