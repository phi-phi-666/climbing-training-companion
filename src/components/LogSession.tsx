import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { addSession, type Exercise } from '../hooks/useSessionHistory'
import {
  sessionTypes,
  boulderSubTypes,
  cardioSubTypes,
  muscleGroups,
  exercisesByGroup,
  crossfitExercisesByGroup,
  mobilityExercises,
  hangboardExercises,
  recoveryTypes,
  type MuscleGroup,
  type SessionType,
  type BoulderSubType,
  type CardioSubType,
  type RecoveryType
} from '../data/exercises'
import Modal from './ui/Modal'
import Accordion from './ui/Accordion'
import WarmupGenerator from './WarmupGenerator'
import CooldownGenerator from './CooldownGenerator'
import INeedMoreGenerator from './INeedMoreGenerator'
import { useToast } from './ui/Toast'
import type { TodayOption } from '../services/ai'
import {
  Mountain,
  Dumbbell,
  Hand,
  Flame,
  Bike,
  Sparkles,
  Footprints,
  Rows3,
  CircleDot,
  Zap,
  StretchHorizontal,
  Heart,
  Clock,
  Dumbbell as ExerciseIcon,
  StickyNote,
  Loader2,
  Plus,
  Maximize2,
  type LucideIcon
} from 'lucide-react'

// Storage key for form persistence
const LOG_FORM_STORAGE_KEY = 'alpha_log_form_state'

interface LogFormState {
  sessionDate: string
  sessionType: SessionType
  boulderSubType: BoulderSubType
  cardioSubType: CardioSubType
  selectedGroups: MuscleGroup[]
  selectedExercises: string[]
  selectedMobilityExercises: string[]
  selectedHangboardExercises: string[]
  selectedRecovery: RecoveryType[]
  duration: number
  notes: string
  warmup: string | null
  cooldown: string | null
  _savedAt: string  // ISO date to check freshness
}

function loadFormState(): Partial<LogFormState> | null {
  try {
    const stored = localStorage.getItem(LOG_FORM_STORAGE_KEY)
    if (!stored) return null

    const parsed: LogFormState = JSON.parse(stored)

    // Check if saved today (don't restore stale state from previous days)
    const savedDate = parsed._savedAt?.split('T')[0]
    const today = new Date().toISOString().split('T')[0]
    if (savedDate !== today) {
      localStorage.removeItem(LOG_FORM_STORAGE_KEY)
      return null
    }

    return parsed
  } catch {
    return null
  }
}

function saveFormState(state: Omit<LogFormState, '_savedAt'>) {
  try {
    const toSave: LogFormState = {
      ...state,
      _savedAt: new Date().toISOString()
    }
    localStorage.setItem(LOG_FORM_STORAGE_KEY, JSON.stringify(toSave))
  } catch {
    // Ignore storage errors
  }
}

function clearFormState() {
  localStorage.removeItem(LOG_FORM_STORAGE_KEY)
}

// Icon mapping for session types
const sessionIcons: Record<string, LucideIcon> = {
  boulder: Mountain,
  lead: Mountain,
  hangboard: Hand,
  gym: Dumbbell,
  cardio: Footprints,
  hiit: Flame,
  crossfit: Zap,
  mobility: StretchHorizontal,
  core: Dumbbell
}

// Icon mapping for cardio sub-types
const cardioIcons: Record<string, LucideIcon> = {
  bike: Bike,
  elliptical: CircleDot,
  run: Footprints,
  row: Rows3
}

// Duration presets
const durationPresets = [30, 60, 90, 120]

function getDateOptions(): { value: string; label: string }[] {
  const options = []
  const today = new Date()

  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const value = date.toISOString().split('T')[0]

    let label: string
    if (i === 0) {
      label = 'Today'
    } else if (i === 1) {
      label = 'Yesterday'
    } else {
      label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    }

    options.push({ value, label })
  }

  return options
}

export default function LogSession() {
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()
  const prefill = (location.state as { prefill?: TodayOption })?.prefill

  // Load saved state from localStorage
  const savedState = loadFormState()

  const [sessionDate, setSessionDate] = useState(savedState?.sessionDate ?? new Date().toISOString().split('T')[0])
  const [sessionType, setSessionType] = useState<SessionType>(savedState?.sessionType ?? 'boulder')
  const [boulderSubType, setBoulderSubType] = useState<BoulderSubType>(savedState?.boulderSubType ?? 'problems')
  const [cardioSubType, setCardioSubType] = useState<CardioSubType>(savedState?.cardioSubType ?? 'run')
  const [selectedGroups, setSelectedGroups] = useState<MuscleGroup[]>(savedState?.selectedGroups ?? [])
  const [selectedExercises, setSelectedExercises] = useState<string[]>(savedState?.selectedExercises ?? [])
  const [selectedMobilityExercises, setSelectedMobilityExercises] = useState<string[]>(savedState?.selectedMobilityExercises ?? [])
  const [selectedHangboardExercises, setSelectedHangboardExercises] = useState<string[]>(savedState?.selectedHangboardExercises ?? [])
  const [selectedRecovery, setSelectedRecovery] = useState<RecoveryType[]>(savedState?.selectedRecovery ?? [])
  const [duration, setDuration] = useState(savedState?.duration ?? 60)
  const [notes, setNotes] = useState(savedState?.notes ?? '')
  const [warmup, setWarmup] = useState<string | null>(savedState?.warmup ?? null)
  const [cooldown, setCooldown] = useState<string | null>(savedState?.cooldown ?? null)
  const [supplementary, setSupplementary] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [showWarmup, setShowWarmup] = useState(false)
  const [showCooldown, setShowCooldown] = useState(false)
  const [showSupplementary, setShowSupplementary] = useState(false)
  const [showNotesExpanded, setShowNotesExpanded] = useState(false)
  const [warmupFlash, setWarmupFlash] = useState(false)
  const [cooldownFlash, setCooldownFlash] = useState(false)
  const [supplementaryFlash, setSupplementaryFlash] = useState(false)

  // Handle prefill from Today's Options
  useEffect(() => {
    if (prefill) {
      // Skip if it's a rest day - rest days don't need logging
      if (prefill.sessionType === 'rest' || prefill.isRestDay) {
        window.history.replaceState({}, document.title)
        return
      }
      setSessionType(prefill.sessionType as SessionType)
      setDuration(prefill.durationMinutes)

      if (prefill.boulderSubType) {
        setBoulderSubType(prefill.boulderSubType)
      }
      if (prefill.cardioSubType) {
        setCardioSubType(prefill.cardioSubType)
      }
      if (prefill.muscleGroups) {
        setSelectedGroups(prefill.muscleGroups as MuscleGroup[])
      }

      // Build notes from exercises with sets/reps
      const exerciseNotes = prefill.exercises
        .map(ex => {
          let line = ex.name
          if (ex.sets && ex.reps) {
            line += `: ${ex.sets}×${ex.reps}`
          } else if (ex.sets) {
            line += `: ${ex.sets} sets`
          } else if (ex.reps) {
            line += `: ${ex.reps}`
          }
          return line
        })
        .join('\n')

      let fullNotes = exerciseNotes
      if (prefill.recoveryNotes) {
        fullNotes += '\n\n' + prefill.recoveryNotes
      }
      setNotes(fullNotes)

      // Try to match exercise names to available exercises
      const exerciseNames = prefill.exercises.map(e => e.name)

      if (prefill.sessionType === 'mobility') {
        const matchedMobility = mobilityExercises.filter(e =>
          exerciseNames.some(name => name.toLowerCase().includes(e.toLowerCase()) || e.toLowerCase().includes(name.toLowerCase()))
        )
        setSelectedMobilityExercises(matchedMobility)
      } else if (prefill.sessionType === 'hangboard') {
        const matchedHangboard = hangboardExercises.filter(e =>
          exerciseNames.some(name => name.toLowerCase().includes(e.toLowerCase()) || e.toLowerCase().includes(name.toLowerCase()))
        )
        setSelectedHangboardExercises(matchedHangboard)
      } else if (['gym', 'crossfit', 'hiit'].includes(prefill.sessionType)) {
        // Try to auto-select exercises that match
        const exerciseMap = prefill.sessionType === 'crossfit' ? crossfitExercisesByGroup : exercisesByGroup
        const allExercises = Object.values(exerciseMap).flat()
        const matchedExercises = allExercises.filter(e =>
          exerciseNames.some(name => name.toLowerCase().includes(e.toLowerCase()) || e.toLowerCase().includes(name.toLowerCase()))
        )
        setSelectedExercises(matchedExercises)
      }

      // Clear location state so refresh doesn't re-apply
      window.history.replaceState({}, document.title)
    }
  }, [prefill])

  // Persist form state to localStorage whenever it changes
  useEffect(() => {
    // Don't save if we just loaded from prefill (let user modify first)
    if (prefill) return

    saveFormState({
      sessionDate,
      sessionType,
      boulderSubType,
      cardioSubType,
      selectedGroups,
      selectedExercises,
      selectedMobilityExercises,
      selectedHangboardExercises,
      selectedRecovery,
      duration,
      notes,
      warmup,
      cooldown
    })
  }, [
    sessionDate,
    sessionType,
    boulderSubType,
    cardioSubType,
    selectedGroups,
    selectedExercises,
    selectedMobilityExercises,
    selectedHangboardExercises,
    selectedRecovery,
    duration,
    notes,
    warmup,
    cooldown,
    prefill
  ])

  // Flash animation when warmup is generated
  const handleWarmupGenerated = (newWarmup: string) => {
    setWarmup(newWarmup)
    setWarmupFlash(true)
    setTimeout(() => setWarmupFlash(false), 600)
  }

  // Flash animation when cooldown is generated
  const handleCooldownGenerated = (newCooldown: string) => {
    setCooldown(newCooldown)
    setCooldownFlash(true)
    setTimeout(() => setCooldownFlash(false), 600)
  }

  // Handler for "I Need More" workout generation
  const handleINeedMoreGenerated = (notesText: string) => {
    // Append to existing notes or set as new
    if (notes.trim()) {
      setNotes(notes + '\n\n---\nBonus Workout:\n' + notesText)
    } else {
      setNotes('Bonus Workout:\n' + notesText)
    }

    // Update supplementary state to show checkmark
    setSupplementary('Workout Added')
    setSupplementaryFlash(true)
    setTimeout(() => setSupplementaryFlash(false), 600)
  }

  const dateOptions = getDateOptions()
  const isCrossfit = sessionType === 'crossfit'
  const exerciseMap = isCrossfit ? crossfitExercisesByGroup : exercisesByGroup

  const toggleGroup = (group: MuscleGroup) => {
    setSelectedGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    )
  }

  const toggleExercise = (exercise: string) => {
    setSelectedExercises((prev) =>
      prev.includes(exercise)
        ? prev.filter((e) => e !== exercise)
        : [...prev, exercise]
    )
  }

  const toggleMobilityExercise = (exercise: string) => {
    setSelectedMobilityExercises((prev) =>
      prev.includes(exercise)
        ? prev.filter((e) => e !== exercise)
        : [...prev, exercise]
    )
  }

  const toggleHangboardExercise = (exercise: string) => {
    setSelectedHangboardExercises((prev) =>
      prev.includes(exercise)
        ? prev.filter((e) => e !== exercise)
        : [...prev, exercise]
    )
  }

  const toggleRecovery = (type: RecoveryType) => {
    setSelectedRecovery((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  const availableExercises = selectedGroups.flatMap(
    (group) => exerciseMap[group]
  )

  // Session types that show muscle groups / exercises
  const showMuscleGroups = ['gym', 'crossfit', 'hiit'].includes(sessionType)
  const showMobilityExercises = sessionType === 'mobility'
  const showHangboardExercises = sessionType === 'hangboard'

  // Count selected exercises for badge
  const exerciseCount = showMobilityExercises
    ? selectedMobilityExercises.length
    : showHangboardExercises
    ? selectedHangboardExercises.length
    : selectedExercises.length

  const handleSave = async () => {
    if (saving) return
    setSaving(true)

    let exercises: Exercise[] = []

    if (showMobilityExercises) {
      exercises = selectedMobilityExercises.map((name) => ({
        name,
        muscleGroup: 'mobility'
      }))
    } else if (showHangboardExercises) {
      exercises = selectedHangboardExercises.map((name) => ({
        name,
        muscleGroup: 'fingers'
      }))
    } else if (showMuscleGroups) {
      exercises = selectedExercises.map((name) => {
        const muscleGroup =
          selectedGroups.find((g) => exerciseMap[g].includes(name)) || ''
        return { name, muscleGroup }
      })
    }

    // Add recovery activities to notes if any selected
    let finalNotes = notes
    if (selectedRecovery.length > 0) {
      const recoveryLabels = selectedRecovery
        .map(r => recoveryTypes.find(rt => rt.value === r)?.label)
        .filter(Boolean)
        .join(', ')
      if (finalNotes) {
        finalNotes += '\n\nRecovery: ' + recoveryLabels
      } else {
        finalNotes = 'Recovery: ' + recoveryLabels
      }
    }

    await addSession({
      date: sessionDate,
      type: sessionType,
      boulderSubType: sessionType === 'boulder' ? boulderSubType : undefined,
      cardioSubType: sessionType === 'cardio' ? cardioSubType : undefined,
      exercises,
      durationMinutes: duration,
      notes: finalNotes || undefined,
      warmup: warmup || undefined,
      cooldown: cooldown || undefined
    })

    // Clear saved form state after successful save
    clearFormState()

    showToast('Session saved!')
    navigate('/')
  }

  return (
    <div className="space-y-3 pt-2">
      {/* Prefill indicator */}
      {prefill && (
        <div className="text-center text-rose-400 text-sm py-1">
          Pre-filled from Today's Plan
        </div>
      )}

      {/* Date selector - all 7 days */}
      <div className="card py-3">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {dateOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSessionDate(option.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                sessionDate === option.value
                  ? 'bg-rose-500 text-white'
                  : 'bg-void-100 text-zinc-400 hover:text-zinc-200 border border-violet-900/20'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Session Type - 4x2 compact grid */}
      <div className="card">
        <div className="grid grid-cols-4 gap-1.5">
          {sessionTypes.map((type) => {
            const Icon = sessionIcons[type.value]
            const isSelected = sessionType === type.value
            return (
              <button
                key={type.value}
                onClick={() => setSessionType(type.value)}
                className={`p-2.5 rounded-xl text-center transition-all ${
                  isSelected
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                    : 'bg-void-100 text-zinc-400 hover:text-zinc-200 border border-violet-900/20'
                }`}
              >
                <Icon size={22} strokeWidth={1.5} className="mx-auto mb-1" />
                <div className="text-[10px] font-medium tracking-wide">{type.label}</div>
              </button>
            )
          })}
        </div>

        {/* Boulder sub-types inline */}
        {sessionType === 'boulder' && (
          <div className="flex gap-1.5 mt-3 pt-3 border-t border-violet-900/20">
            {boulderSubTypes.map((subType) => (
              <button
                key={subType.value}
                onClick={() => setBoulderSubType(subType.value)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                  boulderSubType === subType.value
                    ? 'bg-rose-600 text-white'
                    : 'bg-void-100 text-zinc-400 hover:text-zinc-200 border border-violet-900/20'
                }`}
              >
                {subType.label}
              </button>
            ))}
          </div>
        )}

        {/* Cardio sub-types inline */}
        {sessionType === 'cardio' && (
          <div className="flex gap-1.5 mt-3 pt-3 border-t border-violet-900/20">
            {cardioSubTypes.map((subType) => {
              const Icon = cardioIcons[subType.value]
              return (
                <button
                  key={subType.value}
                  onClick={() => setCardioSubType(subType.value)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex flex-col items-center gap-1 ${
                    cardioSubType === subType.value
                      ? 'bg-rose-600 text-white'
                      : 'bg-void-100 text-zinc-400 hover:text-zinc-200 border border-violet-900/20'
                  }`}
                >
                  <Icon size={16} strokeWidth={1.5} />
                  {subType.label}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Duration - with preset buttons */}
      <div className="card py-3">
        <div className="flex items-center gap-2 mb-2">
          <Clock size={16} className="text-zinc-500" />
          <div className="flex gap-1.5">
            {durationPresets.map((preset) => (
              <button
                key={preset}
                onClick={() => setDuration(preset)}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                  duration === preset
                    ? 'bg-rose-500 text-white'
                    : 'bg-void-100 text-zinc-500 hover:text-zinc-300 border border-violet-900/20'
                }`}
              >
                {preset}m
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="15"
            max="240"
            step="15"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="flex-1 accent-rose-500 h-2"
          />
          <span className="font-mono text-lg w-14 text-right text-rose-400 font-semibold">{duration}<span className="text-xs text-zinc-500 ml-0.5">m</span></span>
        </div>
      </div>

      {/* AI Warmup/Cooldown - compact buttons with flash animation */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowWarmup(true)}
          className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl transition-all ${
            warmup
              ? 'bg-rose-600 text-white'
              : 'bg-gradient-to-r from-rose-600 to-rose-500 text-white hover:from-rose-500 hover:to-rose-400'
          } ${warmupFlash ? 'success-flash' : ''}`}
        >
          <Sparkles size={18} strokeWidth={1.5} />
          <span className="text-sm font-medium">{warmup ? 'Warmup ✓' : 'Warmup'}</span>
        </button>
        <button
          onClick={() => setShowCooldown(true)}
          className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl transition-all ${
            cooldown
              ? 'bg-accent-600 text-white'
              : 'bg-gradient-to-r from-accent-600 to-accent-500 text-white hover:from-accent-500 hover:to-accent-400'
          } ${cooldownFlash ? 'success-flash' : ''}`}
        >
          <StretchHorizontal size={18} strokeWidth={1.5} />
          <span className="text-sm font-medium">{cooldown ? 'Cooldown ✓' : 'Cooldown'}</span>
        </button>
      </div>

      {/* I Need More - Supplementary/Antagonist exercises */}
      <button
        onClick={() => setShowSupplementary(true)}
        className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl transition-all ${
          supplementary
            ? 'bg-amber-600 text-white'
            : 'bg-void-100 text-amber-400 hover:bg-amber-900/30 border border-amber-700/30'
        } ${supplementaryFlash ? 'success-flash' : ''}`}
      >
        <Plus size={18} strokeWidth={1.5} />
        <span className="text-sm font-medium">{supplementary ? 'Bonus Workout ✓' : 'I Need More!'}</span>
      </button>

      {/* Exercises accordion - only show when relevant */}
      {(showMuscleGroups || showMobilityExercises || showHangboardExercises) && (
        <Accordion
          title="EXERCISES"
          icon={<ExerciseIcon size={16} />}
          badge={exerciseCount > 0 ? exerciseCount : undefined}
          defaultOpen={false}
        >
          {/* Hangboard Exercises */}
          {showHangboardExercises && (
            <div className="flex flex-wrap gap-1.5">
              {hangboardExercises.map((exercise) => (
                <button
                  key={exercise}
                  onClick={() => toggleHangboardExercise(exercise)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedHangboardExercises.includes(exercise)
                      ? 'bg-accent-500 text-white'
                      : 'bg-void-100 text-zinc-400 hover:text-zinc-200 border border-violet-900/20'
                  }`}
                >
                  {exercise}
                </button>
              ))}
            </div>
          )}

          {/* Mobility Exercises */}
          {showMobilityExercises && (
            <div className="flex flex-wrap gap-1.5">
              {mobilityExercises.map((exercise) => (
                <button
                  key={exercise}
                  onClick={() => toggleMobilityExercise(exercise)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedMobilityExercises.includes(exercise)
                      ? 'bg-accent-500 text-white'
                      : 'bg-void-100 text-zinc-400 hover:text-zinc-200 border border-violet-900/20'
                  }`}
                >
                  {exercise}
                </button>
              ))}
            </div>
          )}

          {/* Gym/CrossFit/HIIT - Muscle Groups then Exercises */}
          {showMuscleGroups && (
            <div className="space-y-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Muscle Groups</div>
                <div className="flex flex-wrap gap-1.5">
                  {muscleGroups.map((group) => (
                    <button
                      key={group}
                      onClick={() => toggleGroup(group)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs capitalize font-medium transition-all ${
                        selectedGroups.includes(group)
                          ? 'bg-rose-500 text-white'
                          : 'bg-void-100 text-zinc-400 hover:text-zinc-200 border border-violet-900/20'
                      }`}
                    >
                      {group}
                    </button>
                  ))}
                </div>
              </div>

              {availableExercises.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
                    Exercises {isCrossfit && <span className="text-rose-400">(CrossFit)</span>}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {availableExercises.map((exercise) => (
                      <button
                        key={exercise}
                        onClick={() => toggleExercise(exercise)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          selectedExercises.includes(exercise)
                            ? 'bg-accent-500 text-white'
                            : 'bg-void-100 text-zinc-400 hover:text-zinc-200 border border-violet-900/20'
                        }`}
                      >
                        {exercise}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Accordion>
      )}

      {/* Recovery accordion */}
      <Accordion
        title="RECOVERY"
        icon={<Heart size={16} />}
        badge={selectedRecovery.length > 0 ? selectedRecovery.length : undefined}
        defaultOpen={false}
      >
        <div className="flex flex-wrap gap-1.5">
          {recoveryTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => toggleRecovery(type.value)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedRecovery.includes(type.value)
                  ? 'bg-violet-500 text-white'
                  : 'bg-void-100 text-zinc-400 hover:text-zinc-200 border border-violet-900/20'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </Accordion>

      {/* Notes accordion */}
      <Accordion
        title="NOTES"
        icon={<StickyNote size={16} />}
        badge={notes.length > 0 ? '...' : undefined}
        defaultOpen={!!notes}
      >
        <div className="relative">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How did it feel? Any PRs?"
            className="input min-h-20 resize-none text-sm pr-10"
          />
          <button
            onClick={() => setShowNotesExpanded(true)}
            className="absolute right-2 top-2 p-1.5 rounded-lg bg-void-50 hover:bg-void-100 text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Expand notes"
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </Accordion>

      {/* Save button with spinner */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-primary w-full py-4 font-semibold tracking-wide flex items-center justify-center gap-2"
      >
        {saving ? (
          <>
            <Loader2 size={20} className="spinner" />
            <span>Saving...</span>
          </>
        ) : (
          <span>Save Session</span>
        )}
      </button>

      <Modal
        isOpen={showWarmup}
        onClose={() => setShowWarmup(false)}
        title="AI Warmup"
      >
        <WarmupGenerator
          key={`warmup-${sessionType}-${boulderSubType || 'none'}`}
          sessionType={sessionType}
          boulderSubType={sessionType === 'boulder' ? boulderSubType : undefined}
          onClose={() => setShowWarmup(false)}
          onWarmupGenerated={handleWarmupGenerated}
          savedWarmup={warmup}
        />
      </Modal>

      <Modal
        isOpen={showCooldown}
        onClose={() => setShowCooldown(false)}
        title="AI Cooldown"
      >
        <CooldownGenerator
          key={`cooldown-${sessionType}-${boulderSubType || 'none'}`}
          sessionType={sessionType}
          boulderSubType={sessionType === 'boulder' ? boulderSubType : undefined}
          onClose={() => setShowCooldown(false)}
          onCooldownGenerated={handleCooldownGenerated}
          savedCooldown={cooldown}
          muscleGroups={selectedGroups}
          exercises={selectedExercises}
        />
      </Modal>

      <Modal
        isOpen={showSupplementary}
        onClose={() => setShowSupplementary(false)}
        title="I Need More!"
      >
        <INeedMoreGenerator
          key={`supplementary-${sessionType}-${boulderSubType || 'none'}`}
          sessionType={sessionType}
          boulderSubType={sessionType === 'boulder' ? boulderSubType : undefined}
          onClose={() => setShowSupplementary(false)}
          onWorkoutGenerated={handleINeedMoreGenerated}
        />
      </Modal>

      {/* Expanded Notes Modal */}
      <Modal
        isOpen={showNotesExpanded}
        onClose={() => setShowNotesExpanded(false)}
        title="Notes"
      >
        <div className="flex flex-col h-[70vh]">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How did it feel? Any PRs? Write as much as you want..."
            className="input flex-1 resize-none text-sm leading-relaxed"
            autoFocus
          />
          <button
            onClick={() => setShowNotesExpanded(false)}
            className="btn-primary mt-4 py-3"
          >
            Done
          </button>
        </div>
      </Modal>
    </div>
  )
}
