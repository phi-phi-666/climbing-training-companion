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
}

interface WorkoutTimerProps {
  routine: string  // The generated warmup/cooldown text
  title: string    // "Warmup" or "Cooldown"
  onClose: () => void
  onComplete: () => void
}

// Parse duration strings like "2 min", "30 sec", "1-2 min", "45s", etc.
function parseDuration(text: string): number {
  // Check for minutes
  let match = text.match(/(\d+)\s*min/i) || text.match(/(\d+)\s*m(?![a-z])/i)
  if (match) {
    return parseInt(match[1]) * 60
  }

  // Check for seconds
  match = text.match(/(\d+)\s*sec/i) || text.match(/(\d+)\s*s(?![a-z])/i)
  if (match) {
    return parseInt(match[1])
  }

  // Check for range (1-2 min) - take average
  match = text.match(/(\d+)-(\d+)\s*min/i)
  if (match) {
    return Math.round((parseInt(match[1]) + parseInt(match[2])) / 2) * 60
  }

  // Check for "each side" - double the time
  const eachSideMatch = text.match(/each\s*side/i)

  // Check for reps - assume 30 sec per set
  match = text.match(/(\d+)\s*x/i)
  if (match) {
    const sets = parseInt(match[1])
    return sets * 30 * (eachSideMatch ? 2 : 1)
  }

  // Default: 60 seconds for unknown durations
  return 60
}

// Parse the routine text into exercises
function parseRoutine(routine: string): Exercise[] {
  const lines = routine.split('\n').filter(line => line.trim())
  const exercises: Exercise[] = []

  for (const line of lines) {
    // Skip empty lines or lines that look like headers
    if (!line.trim() || line.match(/^(warmup|cooldown|exercises|notes)/i)) {
      continue
    }

    // Remove numbering like "1. ", "1) ", "- ", etc.
    let cleanLine = line.replace(/^[\d]+[.)]\s*/, '').replace(/^[-•]\s*/, '').trim()

    if (!cleanLine) continue

    // Extract exercise name (everything before duration hint)
    const durationHints = /([\d]+ ?min|[\d]+ ?sec|[\d]+s\b|[\d]+m\b|[\d]+-[\d]+ ?min|[\d]+ ?x)/i
    const nameMatch = cleanLine.match(durationHints)

    let name = cleanLine
    if (nameMatch && nameMatch.index !== undefined) {
      // If duration is at the start, take everything after
      if (nameMatch.index < 10) {
        name = cleanLine.substring(nameMatch.index + nameMatch[0].length).trim()
        // Remove leading punctuation
        name = name.replace(/^[:\-–—]\s*/, '')
      } else {
        // Duration is at the end, take everything before
        name = cleanLine.substring(0, nameMatch.index).trim()
        // Remove trailing punctuation
        name = name.replace(/[:\-–—]\s*$/, '')
      }
    }

    // If name ends up too short, use the whole line
    if (name.length < 3) {
      name = cleanLine.replace(/\([^)]+\)/g, '').trim()  // Remove parenthetical content
    }

    // Parse duration from the original line
    const duration = parseDuration(cleanLine)

    exercises.push({
      name: name.substring(0, 50),  // Truncate long names
      durationSeconds: duration,
      originalLine: cleanLine
    })
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
  const [timeRemaining, setTimeRemaining] = useState(exercises[0]?.durationSeconds || 60)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isResting, setIsResting] = useState(false)  // Between exercise rest
  const [autoAdvance, setAutoAdvance] = useState(true)
  const [restBetween, setRestBetween] = useState(15)  // Configurable rest duration
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showSettings, setShowSettings] = useState(false)

  const intervalRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

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
        }
      } else if (currentIndex < exercises.length - 1) {
        // Exercise done, start rest period if auto-advance
        if (autoAdvance) {
          setIsResting(true)
          setTimeRemaining(restBetween)
        } else {
          setIsPlaying(false)
        }
      } else {
        // Workout complete!
        setIsPlaying(false)
        playBeep(1200, 500)
        onComplete()
      }
    }
  }, [timeRemaining, isResting, currentIndex, exercises, autoAdvance, restBetween, playBeep, onComplete])

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
    setTimeRemaining(exercises[0]?.durationSeconds || 60)
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
        <div className="bg-void-100 rounded-xl p-4 border border-violet-900/20">
          <div className="flex items-center justify-between mb-3">
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
      <div className={`p-6 rounded-2xl text-center ${
        isResting
          ? 'bg-gradient-to-br from-violet-600 to-indigo-700'
          : 'bg-gradient-to-br from-rose-600 to-rose-700'
      }`}>
        {isResting ? (
          <>
            <div className="text-sm uppercase tracking-wider opacity-70 mb-2">Rest</div>
            <div className="text-5xl font-mono font-bold mb-2">{formatTime(timeRemaining)}</div>
            <div className="text-sm opacity-80">Up next: {nextExercise?.name}</div>
          </>
        ) : (
          <>
            <div className="text-sm uppercase tracking-wider opacity-70 mb-1">Current</div>
            <div className="text-xl font-semibold mb-3">{currentExercise?.name}</div>
            <div className="text-5xl font-mono font-bold mb-2">{formatTime(timeRemaining)}</div>
            <div className="text-xs opacity-60">
              {formatTime(elapsedSeconds)} / {formatTime(totalSeconds)}
            </div>
          </>
        )}
      </div>

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
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-0.5">Next</div>
              <div className="text-sm text-zinc-300">{nextExercise.name}</div>
            </div>
            <div className="text-sm text-zinc-500">
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
