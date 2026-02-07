import { useState, useEffect, useRef } from 'react'
import { generateWarmup, buildAIContext } from '../services/ai'
import { useSessionHistory } from '../hooks/useSessionHistory'
import { sessionTypes, boulderSubTypes } from '../data/exercises'
import WorkoutTimer from './WorkoutTimer'
import { Play, RefreshCw, AlertTriangle } from 'lucide-react'
import type { Session } from '../services/db'
import type { BoulderSubType } from '../data/exercises'

interface WarmupGeneratorProps {
  sessionType: Session['type']
  boulderSubType?: BoulderSubType
  onClose: () => void
  onWarmupGenerated?: (warmup: string) => void
  savedWarmup?: string | null
}

export default function WarmupGenerator({
  sessionType,
  boulderSubType,
  onClose,
  onWarmupGenerated,
  savedWarmup
}: WarmupGeneratorProps) {
  const [warmup, setWarmup] = useState<string | null>(savedWarmup ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showTimer, setShowTimer] = useState(false)
  const [showMismatchWarning, setShowMismatchWarning] = useState(false)

  // Track which session type the current warmup was generated for
  const generatedForRef = useRef<{ type: string; subType?: string } | null>(
    savedWarmup ? { type: sessionType, subType: boulderSubType } : null
  )

  const lastSessions = useSessionHistory(7)

  useEffect(() => {
    if (savedWarmup) {
      setWarmup(savedWarmup)
    }
  }, [savedWarmup])

  const getSessionLabel = (type?: string, subType?: string) => {
    const t = type || sessionType
    const st = subType || boulderSubType
    const typeInfo = sessionTypes.find(s => s.value === t)
    if (t === 'boulder' && st) {
      const subTypeInfo = boulderSubTypes.find(s => s.value === st)
      return `${typeInfo?.label} - ${subTypeInfo?.label}`
    }
    return typeInfo?.label || t
  }

  const currentSessionLabel = getSessionLabel()
  const generatedForLabel = generatedForRef.current
    ? getSessionLabel(generatedForRef.current.type, generatedForRef.current.subType)
    : null

  // Check if current session type differs from what warmup was generated for
  const hasMismatch = generatedForRef.current && (
    generatedForRef.current.type !== sessionType ||
    (sessionType === 'boulder' && generatedForRef.current.subType !== boulderSubType)
  )

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    setShowMismatchWarning(false)

    try {
      const context = buildAIContext(lastSessions, null)
      const result = await generateWarmup(sessionType, context, boulderSubType)
      setWarmup(result)
      // Update what this warmup was generated for
      generatedForRef.current = { type: sessionType, subType: boulderSubType }
      onWarmupGenerated?.(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate warmup')
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerateClick = () => {
    if (hasMismatch) {
      setShowMismatchWarning(true)
    } else {
      handleGenerate()
    }
  }

  const handleConfirmRegenerate = () => {
    setShowMismatchWarning(false)
    handleGenerate()
  }

  const handleCancelRegenerate = () => {
    setShowMismatchWarning(false)
  }

  return (
    <div className="space-y-4">
      {/* Mismatch warning dialog */}
      {showMismatchWarning && (
        <div className="bg-amber-900/30 border border-amber-700/50 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-amber-200 text-sm font-medium mb-2">
                Session type changed
              </p>
              <p className="text-amber-300/80 text-sm mb-3">
                Current warmup was generated for <span className="font-semibold">{generatedForLabel}</span>.
                <br />
                Regenerate for <span className="font-semibold">{currentSessionLabel}</span>?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleConfirmRegenerate}
                  className="flex-1 bg-amber-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-amber-500 transition-colors"
                >
                  Yes, regenerate
                </button>
                <button
                  onClick={handleCancelRegenerate}
                  className="flex-1 bg-void-100 text-zinc-300 py-2 px-3 rounded-lg text-sm font-medium hover:bg-void-50 transition-colors border border-violet-900/20"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!warmup && !loading && !showMismatchWarning && (
        <div className="text-center py-4">
          <p className="text-stone-300 mb-4">
            Generate an AI-powered warmup routine tailored for your{' '}
            <span className="font-semibold text-rose-400">
              {currentSessionLabel}
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
          <div className="inline-block w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-stone-400">Generating warmup for {currentSessionLabel}...</p>
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

      {warmup && !showTimer && !showMismatchWarning && (
        <div className="space-y-4">
          {/* Show mismatch indicator if applicable */}
          {hasMismatch && (
            <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg px-3 py-2 text-xs text-amber-400">
              ⚠️ Generated for {generatedForLabel} (current: {currentSessionLabel})
            </div>
          )}

          <div className="bg-void-100 rounded-xl p-4 border border-violet-900/20">
            <div className="text-sm leading-relaxed text-zinc-200">
              {warmup.split('\n').map((line, i) => (
                <p key={i} className={line.trim() ? 'mb-2' : 'mb-4'}>
                  {line}
                </p>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowTimer(true)}
            className="w-full btn-primary flex items-center justify-center gap-2 py-3"
          >
            <Play size={18} strokeWidth={2} />
            <span>Start Timer</span>
          </button>

          <div className="flex gap-3">
            <button
              onClick={handleRegenerateClick}
              className="btn-secondary flex-1 flex items-center justify-center gap-2"
              disabled={loading}
            >
              <RefreshCw size={16} />
              <span>Regenerate</span>
            </button>
            <button onClick={onClose} className="btn-secondary flex-1">
              Done
            </button>
          </div>
        </div>
      )}

      {warmup && showTimer && (
        <WorkoutTimer
          routine={warmup}
          title="Warmup"
          onClose={() => setShowTimer(false)}
          onComplete={() => {
            setShowTimer(false)
            onClose()
          }}
        />
      )}
    </div>
  )
}
