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
import WarmupGenerator from './WarmupGenerator'
import CooldownGenerator from './CooldownGenerator'
import type { TodayOption } from '../services/ai'
import {
  Mountain,
  Dumbbell,
  Hand,
  Flame,
  Bike,
  Sparkles,
  ChevronRight,
  Footprints,
  Rows3,
  CircleDot,
  Zap,
  StretchHorizontal,
  Heart,
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

// Icon mapping for cardio sub-types
const cardioIcons: Record<string, LucideIcon> = {
  bike: Bike,
  elliptical: CircleDot,
  run: Footprints,
  row: Rows3
}

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
  const prefill = (location.state as { prefill?: TodayOption })?.prefill

  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0])
  const [sessionType, setSessionType] = useState<SessionType>('boulder')
  const [boulderSubType, setBoulderSubType] = useState<BoulderSubType>('problems')
  const [cardioSubType, setCardioSubType] = useState<CardioSubType>('run')
  const [selectedGroups, setSelectedGroups] = useState<MuscleGroup[]>([])
  const [selectedExercises, setSelectedExercises] = useState<string[]>([])
  const [selectedMobilityExercises, setSelectedMobilityExercises] = useState<string[]>([])
  const [selectedHangboardExercises, setSelectedHangboardExercises] = useState<string[]>([])
  const [selectedRecovery, setSelectedRecovery] = useState<RecoveryType[]>([])
  const [duration, setDuration] = useState(60)
  const [notes, setNotes] = useState('')
  const [warmup, setWarmup] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [showWarmup, setShowWarmup] = useState(false)
  const [showCooldown, setShowCooldown] = useState(false)

  // Handle prefill from Today's Options
  useEffect(() => {
    if (prefill) {
      setSessionType(prefill.sessionType)
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

    navigate('/')
  }

  return (
    <div className="space-y-6">
      <header className="py-4">
        <h1 className="text-2xl font-bold">Log Session</h1>
        {prefill && (
          <p className="text-rose-400 text-sm mt-1">Pre-filled from Today's Plan</p>
        )}
      </header>

      <section className="card">
        <h2 className="text-lg font-semibold mb-3">Date</h2>
        <div className="flex flex-wrap gap-2">
          {dateOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSessionDate(option.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                sessionDate === option.value
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700 border border-stone-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold mb-3">Session Type</h2>
        <div className="grid grid-cols-2 gap-2">
          {sessionTypes.map((type) => {
            const Icon = sessionIcons[type.value]
            return (
              <button
                key={type.value}
                onClick={() => setSessionType(type.value)}
                className={`p-4 rounded-xl text-center transition-all ${
                  sessionType === type.value
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700 border border-stone-700'
                }`}
              >
                <Icon size={28} strokeWidth={1.5} className="mx-auto mb-2" />
                <div className="text-sm font-medium">{type.label}</div>
              </button>
            )
          })}
        </div>
      </section>

      {/* Bouldering Sub-Types */}
      {sessionType === 'boulder' && (
        <section className="card">
          <h2 className="text-lg font-semibold mb-3">Bouldering Type</h2>
          <div className="grid grid-cols-2 gap-2">
            {boulderSubTypes.map((subType) => (
              <button
                key={subType.value}
                onClick={() => setBoulderSubType(subType.value)}
                className={`p-3 rounded-xl text-center transition-all ${
                  boulderSubType === subType.value
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700 border border-stone-700'
                }`}
              >
                <div className="text-sm font-medium">{subType.label}</div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Cardio Sub-Types */}
      {sessionType === 'cardio' && (
        <section className="card">
          <h2 className="text-lg font-semibold mb-3">Cardio Type</h2>
          <div className="grid grid-cols-2 gap-2">
            {cardioSubTypes.map((subType) => {
              const Icon = cardioIcons[subType.value]
              return (
                <button
                  key={subType.value}
                  onClick={() => setCardioSubType(subType.value)}
                  className={`p-3 rounded-xl text-center transition-all ${
                    cardioSubType === subType.value
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                      : 'bg-stone-800 text-stone-300 hover:bg-stone-700 border border-stone-700'
                  }`}
                >
                  <Icon size={24} strokeWidth={1.5} className="mx-auto mb-1" />
                  <div className="text-sm font-medium">{subType.label}</div>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* Hangboard Exercises */}
      {showHangboardExercises && (
        <section className="card">
          <h2 className="text-lg font-semibold mb-3">Hangboard Exercises</h2>
          <div className="flex flex-wrap gap-2">
            {hangboardExercises.map((exercise) => (
              <button
                key={exercise}
                onClick={() => toggleHangboardExercise(exercise)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedHangboardExercises.includes(exercise)
                    ? 'bg-accent-500 text-white shadow-md shadow-accent-500/20'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700 border border-stone-700'
                }`}
              >
                {exercise}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Mobility Exercises */}
      {showMobilityExercises && (
        <section className="card">
          <h2 className="text-lg font-semibold mb-3">Exercises</h2>
          <div className="flex flex-wrap gap-2">
            {mobilityExercises.map((exercise) => (
              <button
                key={exercise}
                onClick={() => toggleMobilityExercise(exercise)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedMobilityExercises.includes(exercise)
                    ? 'bg-accent-500 text-white shadow-md shadow-accent-500/20'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700 border border-stone-700'
                }`}
              >
                {exercise}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="card">
        <button
          onClick={() => setShowWarmup(true)}
          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-rose-600 to-rose-500 rounded-xl hover:from-rose-500 hover:to-rose-400 transition-all shadow-lg shadow-rose-500/20"
        >
          <div className="flex items-center gap-3">
            <Sparkles size={24} strokeWidth={1.5} />
            <div className="text-left">
              <div className="font-semibold">Generate AI Warmup</div>
              <div className="text-sm text-rose-200">
                Personalized for your session
              </div>
            </div>
          </div>
          <ChevronRight size={24} strokeWidth={1.5} />
        </button>
        <button
          onClick={() => setShowCooldown(true)}
          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-accent-600 to-accent-500 rounded-xl hover:from-accent-500 hover:to-accent-400 transition-all mt-3 shadow-lg shadow-accent-500/20"
        >
          <div className="flex items-center gap-3">
            <StretchHorizontal size={24} strokeWidth={1.5} />
            <div className="text-left">
              <div className="font-semibold">Generate AI Cooldown</div>
              <div className="text-sm text-accent-200">
                Stretches for recovery
              </div>
            </div>
          </div>
          <ChevronRight size={24} strokeWidth={1.5} />
        </button>
      </section>

      {/* Muscle Groups - only for gym, crossfit, hiit */}
      {showMuscleGroups && (
        <section className="card">
          <h2 className="text-lg font-semibold mb-3">Muscle Groups</h2>
          <div className="flex flex-wrap gap-2">
            {muscleGroups.map((group) => (
              <button
                key={group}
                onClick={() => toggleGroup(group)}
                className={`px-3 py-2 rounded-xl text-sm capitalize font-medium transition-all ${
                  selectedGroups.includes(group)
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700 border border-stone-700'
                }`}
              >
                {group}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Exercises - only when muscle groups selected */}
      {showMuscleGroups && availableExercises.length > 0 && (
        <section className="card">
          <h2 className="text-lg font-semibold mb-3">
            Exercises {isCrossfit && <span className="text-rose-400 text-sm">(CrossFit)</span>}
          </h2>
          <div className="flex flex-wrap gap-2">
            {availableExercises.map((exercise) => (
              <button
                key={exercise}
                onClick={() => toggleExercise(exercise)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedExercises.includes(exercise)
                    ? 'bg-accent-500 text-white shadow-md shadow-accent-500/20'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700 border border-stone-700'
                }`}
              >
                {exercise}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="card">
        <h2 className="text-lg font-semibold mb-3">Duration (minutes)</h2>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="15"
            max="240"
            step="15"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="flex-1 accent-rose-500"
          />
          <span className="font-mono text-xl w-16 text-right text-rose-400">{duration}</span>
        </div>
      </section>

      {/* Recovery Section */}
      <section className="card border-purple-800/50 bg-gradient-to-br from-stone-900 to-purple-950/30">
        <div className="flex items-center gap-2 mb-3">
          <Heart size={20} strokeWidth={1.5} className="text-purple-400" />
          <h2 className="text-lg font-semibold">Recovery Activities</h2>
        </div>
        <p className="text-stone-500 text-sm mb-3">Optional extras (logged in notes)</p>
        <div className="flex flex-wrap gap-2">
          {recoveryTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => toggleRecovery(type.value)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedRecovery.includes(type.value)
                  ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700 border border-stone-700'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold mb-3">Notes</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How did it feel? Any PRs? Sets/reps details..."
          className="input min-h-24 resize-none"
        />
      </section>

      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-primary w-full text-lg py-4"
      >
        {saving ? 'Saving...' : 'Save Session'}
      </button>

      <Modal
        isOpen={showWarmup}
        onClose={() => setShowWarmup(false)}
        title="AI Warmup Generator"
      >
        <WarmupGenerator
          sessionType={sessionType}
          boulderSubType={sessionType === 'boulder' ? boulderSubType : undefined}
          onClose={() => setShowWarmup(false)}
          onWarmupGenerated={setWarmup}
          savedWarmup={warmup}
        />
      </Modal>

      <Modal
        isOpen={showCooldown}
        onClose={() => setShowCooldown(false)}
        title="AI Cooldown Generator"
      >
        <CooldownGenerator
          sessionType={sessionType}
          onClose={() => setShowCooldown(false)}
          onCooldownGenerated={setCooldown}
          savedCooldown={cooldown}
          muscleGroups={selectedGroups}
          exercises={selectedExercises}
        />
      </Modal>
    </div>
  )
}
