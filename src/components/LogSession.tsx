import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addSession, type Exercise } from '../hooks/useSessionHistory'
import {
  sessionTypes,
  muscleGroups,
  exercisesByGroup,
  type MuscleGroup,
  type SessionType
} from '../data/exercises'
import Modal from './ui/Modal'
import WarmupGenerator from './WarmupGenerator'
import CooldownGenerator from './CooldownGenerator'

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
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0])
  const [sessionType, setSessionType] = useState<SessionType>('boulder')
  const [selectedGroups, setSelectedGroups] = useState<MuscleGroup[]>([])
  const [selectedExercises, setSelectedExercises] = useState<string[]>([])
  const [duration, setDuration] = useState(60)
  const [notes, setNotes] = useState('')
  const [warmup, setWarmup] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [showWarmup, setShowWarmup] = useState(false)
  const [showCooldown, setShowCooldown] = useState(false)

  const dateOptions = getDateOptions()

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

  const availableExercises = selectedGroups.flatMap(
    (group) => exercisesByGroup[group]
  )

  const handleSave = async () => {
    if (saving) return
    setSaving(true)

    const exercises: Exercise[] = selectedExercises.map((name) => {
      const muscleGroup =
        selectedGroups.find((g) => exercisesByGroup[g].includes(name)) || ''
      return { name, muscleGroup }
    })

    await addSession({
      date: sessionDate,
      type: sessionType,
      exercises,
      durationMinutes: duration,
      notes: notes || undefined,
      warmup: warmup || undefined,
      cooldown: cooldown || undefined
    })

    navigate('/')
  }

  return (
    <div className="space-y-6">
      <header className="py-4">
        <h1 className="text-2xl font-bold">Log Session</h1>
      </header>

      <section className="card">
        <h2 className="text-lg font-semibold mb-3">Date</h2>
        <div className="flex flex-wrap gap-2">
          {dateOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSessionDate(option.value)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                sessionDate === option.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
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
          {sessionTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setSessionType(type.value)}
              className={`p-4 rounded-lg text-center transition-colors ${
                sessionType === type.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <div className="text-2xl mb-1">{type.emoji}</div>
              <div className="text-sm">{type.label}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <button
          onClick={() => setShowWarmup(true)}
          className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-500 hover:to-purple-500 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">✨</span>
            <div className="text-left">
              <div className="font-medium">Generate AI Warmup</div>
              <div className="text-sm text-indigo-200">
                Personalized for your session
              </div>
            </div>
          </div>
          <span className="text-xl">→</span>
        </button>
        <button
          onClick={() => setShowCooldown(true)}
          className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-lg hover:from-teal-500 hover:to-cyan-500 transition-colors mt-2"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧘</span>
            <div className="text-left">
              <div className="font-medium">Generate AI Cooldown</div>
              <div className="text-sm text-teal-200">
                Stretches for recovery
              </div>
            </div>
          </div>
          <span className="text-xl">→</span>
        </button>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold mb-3">Muscle Groups</h2>
        <div className="flex flex-wrap gap-2">
          {muscleGroups.map((group) => (
            <button
              key={group}
              onClick={() => toggleGroup(group)}
              className={`px-3 py-2 rounded-lg text-sm capitalize transition-colors ${
                selectedGroups.includes(group)
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {group}
            </button>
          ))}
        </div>
      </section>

      {availableExercises.length > 0 && (
        <section className="card">
          <h2 className="text-lg font-semibold mb-3">Exercises</h2>
          <div className="flex flex-wrap gap-2">
            {availableExercises.map((exercise) => (
              <button
                key={exercise}
                onClick={() => toggleExercise(exercise)}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedExercises.includes(exercise)
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
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
            max="180"
            step="15"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="flex-1"
          />
          <span className="font-mono text-xl w-16 text-right">{duration}</span>
        </div>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold mb-3">Notes</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How did it feel? Any PRs?"
          className="input min-h-24 resize-none"
        />
      </section>

      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-primary w-full text-lg"
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
