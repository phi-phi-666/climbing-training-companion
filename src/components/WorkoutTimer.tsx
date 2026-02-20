import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Settings,
  X
} from 'lucide-react'

interface Exercise {
  name: string
  durationSeconds: number
  originalLine: string
  side?: 'left' | 'right'  // For bilateral exercises
}

interface WorkoutTimerProps {
  routine: string  // The generated warmup/cooldown text
  title: string    // "Warmup" or "Cooldown"
  onClose: () => void
  onComplete: () => void
}

// Parse duration strings like "2 min", "30 sec", "1-2 min", "1.5 min", "45s", etc.
function parseDuration(text: string): number {
  // First, remove the exercise numbering and any leading content before the actual exercise
  // This handles cases like "1. High knees (30 sec)" - we don't want to pick up "1"
  // More aggressive: remove "1.", "1)", "1 ", "1:" at the start
  const cleanedText = text.replace(/^\s*\d+\s*[.):\-]\s*/, '').trim()

  // Check for "each side" - this will double whatever time we compute
  const eachSideMultiplier = cleanedText.match(/each\s*side|per\s*side|both\s*sides/i) ? 2 : 1

  // Check for explicit time durations first (more specific patterns)
  // Look for patterns like "30 sec", "2 min", "1-2 min", "1.5 min"

  // Decimal minutes like "1.5 min" or "0.5 min"
  let match = cleanedText.match(/(\d+\.?\d*)\s*min(?:ute)?s?\b/i)
  if (match) {
    const mins = parseFloat(match[1])
    // Sanity check: warmup exercises rarely exceed 5 minutes
    if (mins <= 5) {
      return Math.round(mins * 60) * eachSideMultiplier
    }
  }

  // Range of minutes (1-2 min) - take average
  match = cleanedText.match(/(\d+)\s*-\s*(\d+)\s*min/i)
  if (match) {
    return Math.round((parseInt(match[1]) + parseInt(match[2])) / 2) * 60 * eachSideMultiplier
  }

  // Seconds with explicit "sec" or "second" suffix
  match = cleanedText.match(/(\d+)\s*sec(?:ond)?s?\b/i)
  if (match) {
    return parseInt(match[1]) * eachSideMultiplier
  }

  // Shorthand like "30s" or "2m" (only at word boundaries, not part of other words)
  match = cleanedText.match(/\b(\d+)\s*s\b/i)
  if (match && !cleanedText.match(new RegExp(`\\d+\\s*sets?`, 'i'))) {
    const secs = parseInt(match[1])
    if (secs <= 120) {
      return secs * eachSideMultiplier
    }
  }

  match = cleanedText.match(/\b(\d+)\s*m\b/i)
  if (match && !cleanedText.match(new RegExp(`\\d+\\s*m(?:eter|ile)`, 'i'))) {
    const mins = parseInt(match[1])
    if (mins <= 5) {
      return mins * 60 * eachSideMultiplier
    }
  }

  // Check for reps/sets patterns like "3 x 10" or "10 reps" - assume ~3 sec per rep
  match = cleanedText.match(/(\d+)\s*x\s*(\d+)/i)
  if (match) {
    const sets = parseInt(match[1])
    const reps = parseInt(match[2])
    return sets * reps * 3 * eachSideMultiplier
  }

  match = cleanedText.match(/(\d+)\s*reps?\b/i)
  if (match) {
    const reps = parseInt(match[1])
    return reps * 3 * eachSideMultiplier
  }

  // Default: 45 seconds for unknown durations (reasonable for most warmup exercises)
  return 45 * eachSideMultiplier
}

// Check if an exercise is bilateral (each side)
function isBilateral(text: string): boolean {
  return /each\s*side|per\s*side|both\s*sides|left.*right|alternate\s*sides/i.test(text)
}

// Parse the routine text into exercises
function parseRoutine(routine: string): Exercise[] {
  const lines = routine.split('\n').filter(line => line.trim())
  const exercises: Exercise[] = []

  for (const line of lines) {
    const trimmedLine = line.trim()

    // Skip empty lines
    if (!trimmedLine) continue

    // Skip header lines (Warmup:, Cooldown:, Notes:, etc.)
    if (trimmedLine.match(/^(warmup|cooldown|exercises?|notes?|stretching|mobility|cool\s*down|warm\s*up)\s*:?\s*$/i)) {
      continue
    }

    // Skip lines that are just headers/section titles (all caps, short)
    if (trimmedLine.match(/^[A-Z\s]{3,20}:?$/) && trimmedLine.length < 25) {
      continue
    }

    // Remove numbering like "1. ", "1) ", "- ", "• ", etc.
    let cleanLine = trimmedLine
      .replace(/^[\d]+[.)]\s*/, '')
      .replace(/^[-•→►]\s*/, '')
      .trim()

    if (!cleanLine || cleanLine.length < 3) continue

    // Extract exercise name - remove duration/rep info from the end
    let name = cleanLine
      // Remove parenthetical duration info like "(30 sec)" or "(2 min)"
      .replace(/\s*\([^)]*(?:sec|min|reps?|sets?|x\s*\d+)[^)]*\)\s*$/i, '')
      // Remove trailing duration like "- 30 sec" or ": 2 min"
      .replace(/\s*[-:–—]\s*\d+\s*(?:sec|min|reps?|sets?|x\s*\d+).*$/i, '')
      // Remove trailing duration like "30 sec" or "2 min" at the very end
      .replace(/\s+\d+\s*(?:sec|min)\s*$/i, '')
      .trim()

    // Clean up any remaining trailing punctuation
    name = name.replace(/[-:–—,]\s*$/, '').trim()

    // If name is too short after cleaning, use the original (minus numbering)
    if (name.length < 3) {
      name = cleanLine.replace(/\s*\([^)]+\)\s*$/, '').trim()
    }

    // Final fallback
    if (name.length < 3) {
      name = cleanLine
    }

    // Parse duration from the FULL original line
    const duration = parseDuration(cleanLine)

    // Split bilateral exercises into separate left/right entries
    if (isBilateral(cleanLine)) {
      // The parseDuration already multiplied by 2 for "each side"
      // So each side gets half the total duration
      const perSide = Math.round(duration / 2)
      // Remove "each side" etc from name for cleaner display
      const cleanName = name.replace(/\s*\(?\s*each\s*side\s*\)?\s*/i, '').trim()
      exercises.push({
        name: `${cleanName} (Left)`,
        durationSeconds: perSide,
        originalLine: cleanLine,
        side: 'left'
      })
      exercises.push({
        name: `${cleanName} (Right)`,
        durationSeconds: perSide,
        originalLine: cleanLine,
        side: 'right'
      })
    } else {
      exercises.push({
        name: name,
        durationSeconds: duration,
        originalLine: cleanLine
      })
    }
  }

  return exercises
}

// Format seconds as MM:SS
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function WorkoutTimer({
  routine,
  title,
  onClose,
  onComplete
}: WorkoutTimerProps) {
  const exercises = parseRoutine(routine)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(exercises[0]?.durationSeconds || 45)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isResting, setIsResting] = useState(false)  // Between exercise rest
  const [autoAdvance, setAutoAdvance] = useState(true)
  const [restBetween, setRestBetween] = useState(15)  // Configurable rest duration
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showSettings, setShowSettings] = useState(false)

  const [vibrationEnabled, setVibrationEnabled] = useState(true)

  const intervalRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  // Wake Lock - keep screen on during workout
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request('screen')
        }
      } catch {
        // Wake Lock not available or denied
      }
    }

    if (isPlaying) {
      requestWakeLock()
    }

    // Re-acquire on visibility change (e.g. tab switch back)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isPlaying) {
        requestWakeLock()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      wakeLockRef.current?.release().catch(() => {})
      wakeLockRef.current = null
    }
  }, [isPlaying])

  // Vibrate helper
  const vibrate = useCallback((pattern: number | number[]) => {
    if (!vibrationEnabled) return
    try {
      navigator.vibrate?.(pattern)
    } catch {
      // Vibration not available
    }
  }, [vibrationEnabled])

  // Play a beep sound
  const playBeep = useCallback((frequency = 800, duration = 150) => {
    if (!soundEnabled) return

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext()
      }
      const ctx = audioContextRef.current
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.frequency.value = frequency
      oscillator.type = 'sine'
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + duration / 1000)
    } catch (e) {
      // Audio not available
    }
  }, [soundEnabled])

  // Timer logic
  useEffect(() => {
    if (isPlaying && timeRemaining > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeRemaining(prev => {
          // Play countdown beeps for last 3 seconds
          if (prev <= 4 && prev > 1) {
            playBeep(600, 100)
          }
          // Final beep
          if (prev === 1) {
            playBeep(900, 300)
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPlaying, timeRemaining, playBeep])

  // Handle timer reaching 0
  useEffect(() => {
    if (timeRemaining === 0) {
      if (isResting) {
        // Rest is over, move to next exercise
        setIsResting(false)
        setCurrentIndex(prev => prev + 1)
        if (currentIndex + 1 < exercises.length) {
          setTimeRemaining(exercises[currentIndex + 1].durationSeconds)
          // Vibrate: new exercise starting
          vibrate([200, 100, 200])
        }
      } else if (currentIndex < exercises.length - 1) {
        // Exercise done, start rest period if auto-advance
        if (autoAdvance) {
          // Shorter rest between sides of same bilateral exercise
          const nextExercise = exercises[currentIndex + 1]
          const currentEx = exercises[currentIndex]
          const isSideSwitch = currentEx?.side === 'left' && nextExercise?.side === 'right'
            && currentEx.originalLine === nextExercise.originalLine
          setIsResting(true)
          setTimeRemaining(isSideSwitch ? 5 : restBetween)
          // Vibrate: rest/switch sides
          vibrate(isSideSwitch ? [100, 50, 100, 50, 100] : [200])
        } else {
          setIsPlaying(false)
          vibrate([200])
        }
      } else {
        // Workout complete!
        setIsPlaying(false)
        playBeep(1200, 500)
        // Vibrate: workout complete (long buzz)
        vibrate([300, 100, 300, 100, 500])
        onComplete()
      }
    }
  }, [timeRemaining, isResting, currentIndex, exercises, autoAdvance, restBetween, playBeep, vibrate, onComplete])

  const currentExercise = exercises[currentIndex]
  const nextExercise = exercises[currentIndex + 1]
  const totalExercises = exercises.length
  const progress = ((currentIndex + 1) / totalExercises) * 100

  // Calculate total time
  const totalSeconds = exercises.reduce((sum, e) => sum + e.durationSeconds, 0)
  const elapsedSeconds = exercises
    .slice(0, currentIndex)
    .reduce((sum, e) => sum + e.durationSeconds, 0) +
    (currentExercise ? currentExercise.durationSeconds - timeRemaining : 0)

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleSkip = () => {
    if (isResting) {
      setIsResting(false)
    }
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setTimeRemaining(exercises[currentIndex + 1].durationSeconds)
      setIsResting(false)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      setTimeRemaining(exercises[currentIndex - 1].durationSeconds)
      setIsResting(false)
    }
  }

  const handleRestart = () => {
    setCurrentIndex(0)
    setTimeRemaining(exercises[0]?.durationSeconds || 45)
    setIsPlaying(false)
    setIsResting(false)
  }

  if (exercises.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-zinc-400 mb-4">Couldn't parse exercises from routine</p>
        <button onClick={onClose} className="btn-secondary">
          Close
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with settings */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-zinc-500">
          {title} • {currentIndex + 1}/{totalExercises}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors"
            title={soundEnabled ? 'Mute' : 'Unmute'}
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="bg-void-100 rounded-xl p-4 border border-violet-900/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-300">Auto-advance</span>
            <button
              onClick={() => setAutoAdvance(!autoAdvance)}
              className={`w-12 h-6 rounded-full transition-colors ${
                autoAdvance ? 'bg-rose-500' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  autoAdvance ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-300">Vibration</span>
            <button
              onClick={() => setVibrationEnabled(!vibrationEnabled)}
              className={`w-12 h-6 rounded-full transition-colors ${
                vibrationEnabled ? 'bg-rose-500' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  vibrationEnabled ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-300">Rest between (sec)</span>
            <div className="flex items-center gap-2">
              {[10, 15, 20, 30].map(sec => (
                <button
                  key={sec}
                  onClick={() => setRestBetween(sec)}
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    restBetween === sec
                      ? 'bg-rose-500 text-white'
                      : 'bg-void-50 text-zinc-400 border border-violet-900/20'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="h-1.5 bg-void-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-rose-500 to-rose-400 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Current exercise / rest display */}
      {(() => {
        const isSideSwitch = isResting && currentExercise?.side === 'left'
          && nextExercise?.side === 'right'
          && currentExercise.originalLine === nextExercise.originalLine
        return (
          <div className={`p-6 rounded-2xl text-center ${
            isResting
              ? isSideSwitch
                ? 'bg-gradient-to-br from-amber-600 to-amber-700'
                : 'bg-gradient-to-br from-violet-600 to-indigo-700'
              : 'bg-gradient-to-br from-rose-600 to-rose-700'
          }`}>
            {isResting ? (
              <>
                <div className="text-sm uppercase tracking-wider opacity-70 mb-2">
                  {isSideSwitch ? 'Switch Sides' : 'Rest'}
                </div>
                <div className="text-5xl font-mono font-bold mb-2">{formatTime(timeRemaining)}</div>
                <div className="text-sm opacity-80 px-4 line-clamp-2">Up next: {nextExercise?.name}</div>
              </>
            ) : (
              <>
                <div className="text-sm uppercase tracking-wider opacity-70 mb-1">Current</div>
                <div className="text-lg font-semibold mb-3 px-2 line-clamp-2 min-h-[3.5rem] flex items-center justify-center">
                  {currentExercise?.name}
                </div>
                <div className="text-5xl font-mono font-bold mb-2">{formatTime(timeRemaining)}</div>
                <div className="text-xs opacity-60">
                  {formatTime(elapsedSeconds)} / {formatTime(totalSeconds)}
                </div>
              </>
            )}
          </div>
        )
      })()}

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="p-3 rounded-xl bg-void-100 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft size={24} />
        </button>

        <button
          onClick={handlePlayPause}
          className="p-4 rounded-xl bg-rose-500 text-white shadow-lg shadow-rose-500/30 hover:bg-rose-400 transition-all"
        >
          {isPlaying ? <Pause size={28} /> : <Play size={28} />}
        </button>

        <button
          onClick={handleSkip}
          disabled={currentIndex >= exercises.length - 1 && !isResting}
          className="p-3 rounded-xl bg-void-100 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Next exercise preview */}
      {nextExercise && !isResting && (
        <div className="bg-void-100 rounded-xl p-3 border border-violet-900/20">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-0.5">Next</div>
              <div className="text-sm text-zinc-300 line-clamp-1">{nextExercise.name}</div>
            </div>
            <div className="text-sm text-zinc-500 flex-shrink-0">
              {formatTime(nextExercise.durationSeconds)}
            </div>
          </div>
        </div>
      )}

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
          className="flex-1 btn-secondary flex items-center justify-center gap-2 py-2.5"
        >
          <X size={16} />
          <span className="text-sm">Close</span>
        </button>
      </div>
    </div>
  )
}
