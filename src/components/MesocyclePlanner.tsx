import { useState } from 'react'
import { useActiveMesocycle, useAllMesocycles } from '../hooks/useMesocycle'
import { useSessionHistory } from '../hooks/useSessionHistory'
import {
  generateMesocycle,
  buildAIContext,
  type MesocycleGoal,
  type GeneratedMesocyclePlan
} from '../services/ai'
import {
  createMesocycle,
  advanceMesocycleWeek,
  completeMesocycle,
  pauseMesocycle,
  resumeMesocycle,
  deleteMesocycle
} from '../services/mesocycle'
import type { Mesocycle } from '../services/db'
import {
  Target,
  Zap,
  TrendingUp,
  Shuffle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  Check,
  Trash2,
  Plus,
  Mountain,
  Hand,
  Dumbbell,
  Footprints,
  Flame,
  StretchHorizontal,
  Coffee,
  type LucideIcon
} from 'lucide-react'

const goalOptions: { value: MesocycleGoal; label: string; description: string; icon: LucideIcon }[] = [
  { value: 'strength', label: 'Strength', description: 'Max finger strength & power', icon: Zap },
  { value: 'endurance', label: 'Endurance', description: 'Work capacity & stamina', icon: TrendingUp },
  { value: 'peak', label: 'Peak', description: 'Competition or trip prep', icon: Target },
  { value: 'general', label: 'General', description: 'Well-rounded fitness', icon: Shuffle }
]

const weekOptions = [4, 6, 8]

const dayLabels: Record<string, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun'
}

const sessionTypeIcons: Record<string, LucideIcon> = {
  boulder: Mountain,
  lead: Mountain,
  hangboard: Hand,
  gym: Dumbbell,
  cardio: Footprints,
  hiit: Flame,
  crossfit: Zap,
  mobility: StretchHorizontal,
  rest: Coffee
}

const intensityColors: Record<string, string> = {
  low: 'text-green-400',
  moderate: 'text-amber-400',
  hard: 'text-orange-400',
  max: 'text-red-400'
}

interface MesocyclePlannerProps {
  onClose: () => void
}

export default function MesocyclePlanner({ onClose }: MesocyclePlannerProps) {
  const activeMesocycle = useActiveMesocycle()
  const allMesocycles = useAllMesocycles()
  const lastSessions = useSessionHistory(7)

  const hasAnyMesocycles = allMesocycles.length > 0
  const [view, setView] = useState<'list' | 'create' | 'preview'>(hasAnyMesocycles ? 'list' : 'create')
  const [selectedGoal, setSelectedGoal] = useState<MesocycleGoal>('general')
  const [selectedWeeks, setSelectedWeeks] = useState(4)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedMesocyclePlan | null>(null)
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null)
  const [expandedMesocycle, setExpandedMesocycle] = useState<number | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)

    try {
      const context = buildAIContext(lastSessions, null)
      const plan = await generateMesocycle(selectedGoal, selectedWeeks, context)
      setGeneratedPlan(plan)
      setView('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate plan')
    } finally {
      setLoading(false)
    }
  }

  const handleSavePlan = async () => {
    if (!generatedPlan) return

    const startDate = new Date().toISOString().split('T')[0]
    await createMesocycle({
      name: generatedPlan.name,
      goal: selectedGoal,
      weeks: selectedWeeks,
      currentWeek: 1,
      startDate,
      status: 'active',
      plan: generatedPlan.weeks.map(w => ({
        weekNumber: w.weekNumber,
        theme: w.theme,
        intensity: w.intensity,
        days: w.days
      }))
    })

    setGeneratedPlan(null)
    setView('list')
  }

  const handleAdvanceWeek = async (id: number) => {
    await advanceMesocycleWeek(id)
  }

  const handleComplete = async (id: number) => {
    await completeMesocycle(id)
  }

  const handlePause = async (id: number) => {
    await pauseMesocycle(id)
  }

  const handleResume = async (id: number) => {
    await resumeMesocycle(id)
  }

  const handleDelete = async (id: number) => {
    await deleteMesocycle(id)
  }

  // Create view
  if (view === 'create') {
    return (
      <div className="space-y-3">
        <div className="text-[10px] uppercase tracking-wider text-zinc-500">Goal</div>
        <div className="flex gap-1.5">
          {goalOptions.map((goal) => {
            const Icon = goal.icon
            return (
              <button
                key={goal.value}
                onClick={() => setSelectedGoal(goal.value)}
                className={`flex-1 p-2.5 rounded-xl text-center transition-all border ${
                  selectedGoal === goal.value
                    ? 'bg-rose-600 text-white border-rose-500'
                    : 'bg-void-100 text-zinc-400 hover:text-zinc-200 border-violet-900/20'
                }`}
              >
                <Icon size={16} className="mx-auto mb-1" />
                <div className="font-medium text-[11px]">{goal.label}</div>
              </button>
            )
          })}
        </div>
        <div className="text-[10px] text-zinc-500 text-center">
          {goalOptions.find(g => g.value === selectedGoal)?.description}
        </div>

        <div className="text-[10px] uppercase tracking-wider text-zinc-500">Duration</div>
        <div className="flex gap-2">
          {weekOptions.map((weeks) => (
            <button
              key={weeks}
              onClick={() => setSelectedWeeks(weeks)}
              className={`flex-1 py-2.5 rounded-xl text-center text-sm font-medium transition-all border ${
                selectedWeeks === weeks
                  ? 'bg-rose-600 text-white border-rose-500'
                  : 'bg-void-100 text-zinc-400 hover:text-zinc-200 border-violet-900/20'
              }`}
            >
              {weeks}w
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-800/30 rounded-xl p-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full btn-primary py-3 font-semibold flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Generating plan...
            </>
          ) : (
            <>
              <Zap size={18} />
              Generate Plan
            </>
          )}
        </button>

        {hasAnyMesocycles && (
          <button
            onClick={() => setView('list')}
            className="w-full text-sm text-zinc-500 hover:text-zinc-300"
          >
            Cancel
          </button>
        )}
      </div>
    )
  }

  // Preview generated plan
  if (view === 'preview' && generatedPlan) {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-rose-600 to-rose-700 rounded-xl p-4">
          <h3 className="font-semibold text-lg">{generatedPlan.name}</h3>
          <div className="text-sm opacity-80 mt-1">
            {selectedWeeks} weeks | {goalOptions.find(g => g.value === selectedGoal)?.label} focus
          </div>
        </div>

        {generatedPlan.weeks.map((week) => (
          <div key={week.weekNumber} className="border border-violet-900/20 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpandedWeek(expandedWeek === week.weekNumber ? null : week.weekNumber)}
              className="w-full p-3 flex items-center justify-between bg-void-100/50 hover:bg-void-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="text-rose-400 font-bold text-sm w-8">W{week.weekNumber}</div>
                <div>
                  <div className="font-medium text-sm text-left">{week.theme}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${
                            i < week.intensity ? 'bg-rose-500' : 'bg-zinc-700'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-zinc-500">{week.intensity}/10</span>
                  </div>
                </div>
              </div>
              {expandedWeek === week.weekNumber ? <ChevronUp size={16} className="text-zinc-500" /> : <ChevronDown size={16} className="text-zinc-500" />}
            </button>

            {expandedWeek === week.weekNumber && (
              <div className="p-3 pt-0 space-y-1.5">
                {Object.entries(week.days).map(([day, dayPlan]) => {
                  const DayIcon = sessionTypeIcons[dayPlan.sessionType] || Dumbbell
                  return (
                    <div key={day} className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-void-50/50">
                      <span className="text-[10px] font-bold text-zinc-500 w-7 uppercase">{dayLabels[day] || day}</span>
                      <DayIcon size={14} className="text-zinc-400" />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium">{dayPlan.focus || dayPlan.sessionType}</span>
                      </div>
                      {dayPlan.intensity && (
                        <span className={`text-[10px] ${intensityColors[dayPlan.intensity] || 'text-zinc-500'}`}>
                          {dayPlan.intensity}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}

        <div className="flex gap-2">
          <button
            onClick={handleSavePlan}
            className="flex-1 btn-primary py-3 font-semibold flex items-center justify-center gap-2"
          >
            <Check size={18} />
            Start Plan
          </button>
          <button
            onClick={() => { setView('create'); setGeneratedPlan(null) }}
            className="flex-1 btn-secondary py-3 flex items-center justify-center gap-2"
          >
            Regenerate
          </button>
        </div>
      </div>
    )
  }

  // List view (default)
  return (
    <div className="space-y-4">
      {/* Active mesocycle card */}
      {activeMesocycle && (
        <ActiveMesocycleCard
          mesocycle={activeMesocycle}
          onAdvanceWeek={handleAdvanceWeek}
          onComplete={handleComplete}
          onPause={handlePause}
          expanded={expandedMesocycle === activeMesocycle.id}
          onToggle={() => setExpandedMesocycle(expandedMesocycle === activeMesocycle.id ? null : activeMesocycle.id!)}
        />
      )}

      {/* Create new plan button */}
      <button
        onClick={() => setView('create')}
        className="w-full p-4 rounded-xl bg-void-100 hover:bg-void-50 border border-violet-900/20 flex items-center justify-center gap-2 text-zinc-400 hover:text-zinc-200 transition-all"
      >
        <Plus size={18} />
        <span className="font-medium text-sm">Create New Plan</span>
      </button>

      {/* Past mesocycles */}
      {allMesocycles.filter(m => m.status !== 'active').length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Past Plans</div>
          <div className="space-y-2">
            {allMesocycles.filter(m => m.status !== 'active').map((mesocycle) => (
              <div key={mesocycle.id} className="border border-violet-900/20 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedMesocycle(expandedMesocycle === mesocycle.id ? null : mesocycle.id!)}
                  className="w-full p-3 flex items-center justify-between bg-void-100/30 hover:bg-void-100/50 transition-colors"
                >
                  <div>
                    <div className="font-medium text-sm text-left">{mesocycle.name}</div>
                    <div className="text-[10px] text-zinc-500 flex items-center gap-2">
                      <span>{mesocycle.weeks} weeks</span>
                      <span className={`px-1.5 py-0.5 rounded ${
                        mesocycle.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        mesocycle.status === 'paused' ? 'bg-amber-500/20 text-amber-400' : ''
                      }`}>
                        {mesocycle.status}
                      </span>
                    </div>
                  </div>
                  {expandedMesocycle === mesocycle.id ? <ChevronUp size={16} className="text-zinc-500" /> : <ChevronDown size={16} className="text-zinc-500" />}
                </button>

                {expandedMesocycle === mesocycle.id && (
                  <div className="p-3 pt-0 border-t border-violet-900/10 space-y-2">
                    <div className="text-xs text-zinc-500">
                      Started {mesocycle.startDate} | Week {mesocycle.currentWeek} of {mesocycle.weeks}
                    </div>
                    <div className="flex gap-2">
                      {mesocycle.status === 'paused' && (
                        <button
                          onClick={() => handleResume(mesocycle.id!)}
                          className="flex-1 btn-secondary text-xs py-2 flex items-center justify-center gap-1"
                        >
                          <Play size={12} /> Resume
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(mesocycle.id!)}
                        className="btn-secondary text-xs py-2 px-3 text-red-400 hover:text-red-300 flex items-center gap-1"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onClose}
        className="w-full text-sm text-zinc-500 hover:text-zinc-300 py-2"
      >
        Close
      </button>
    </div>
  )
}

function ActiveMesocycleCard({
  mesocycle,
  onAdvanceWeek,
  onComplete,
  onPause,
  expanded,
  onToggle
}: {
  mesocycle: Mesocycle
  onAdvanceWeek: (id: number) => void
  onComplete: (id: number) => void
  onPause: (id: number) => void
  expanded: boolean
  onToggle: () => void
}) {
  const progress = (mesocycle.currentWeek / mesocycle.weeks) * 100
  const currentWeekPlan = mesocycle.plan.find(w => w.weekNumber === mesocycle.currentWeek)

  // Get today's day abbreviation
  const dayIndex = new Date().getDay()
  const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  const todayKey = dayKeys[dayIndex]
  const todayPlan = currentWeekPlan?.days[todayKey]

  return (
    <div className="border border-rose-500/30 rounded-xl overflow-hidden bg-gradient-to-br from-rose-900/20 to-rose-800/10">
      <button
        onClick={onToggle}
        className="w-full p-4 text-left"
      >
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="font-semibold">{mesocycle.name}</div>
            <div className="text-xs text-zinc-400">
              Week {mesocycle.currentWeek} of {mesocycle.weeks}
              {currentWeekPlan && <span className="text-rose-400 ml-2">{currentWeekPlan.theme}</span>}
            </div>
          </div>
          {expanded ? <ChevronUp size={16} className="text-zinc-500" /> : <ChevronDown size={16} className="text-zinc-500" />}
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-void-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-rose-500 to-rose-400 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Today's plan */}
        {todayPlan && (
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="text-zinc-500">Today:</span>
            <span className="text-zinc-300 font-medium">{todayPlan.focus || todayPlan.sessionType}</span>
            {todayPlan.intensity && (
              <span className={intensityColors[todayPlan.intensity] || 'text-zinc-500'}>
                {todayPlan.intensity}
              </span>
            )}
          </div>
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Current week details */}
          {currentWeekPlan && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex gap-0.5">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${
                        i < currentWeekPlan.intensity ? 'bg-rose-500' : 'bg-zinc-700'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-zinc-500">Intensity {currentWeekPlan.intensity}/10</span>
              </div>

              {Object.entries(currentWeekPlan.days).map(([day, dayPlan]) => {
                const DayIcon = sessionTypeIcons[dayPlan.sessionType] || Dumbbell
                const isToday = day === todayKey
                return (
                  <div
                    key={day}
                    className={`flex items-center gap-2 py-1.5 px-2 rounded-lg ${
                      isToday ? 'bg-rose-500/20 border border-rose-500/30' : 'bg-void-50/30'
                    }`}
                  >
                    <span className={`text-[10px] font-bold w-7 uppercase ${isToday ? 'text-rose-400' : 'text-zinc-500'}`}>
                      {dayLabels[day] || day}
                    </span>
                    <DayIcon size={14} className={isToday ? 'text-rose-400' : 'text-zinc-400'} />
                    <div className="flex-1 min-w-0">
                      <span className={`text-xs font-medium ${isToday ? 'text-rose-300' : ''}`}>
                        {dayPlan.focus || dayPlan.sessionType}
                      </span>
                    </div>
                    {dayPlan.intensity && (
                      <span className={`text-[10px] ${intensityColors[dayPlan.intensity] || 'text-zinc-500'}`}>
                        {dayPlan.intensity}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {mesocycle.currentWeek < mesocycle.weeks ? (
              <button
                onClick={() => onAdvanceWeek(mesocycle.id!)}
                className="flex-1 btn-primary text-xs py-2 flex items-center justify-center gap-1"
              >
                Next Week
              </button>
            ) : (
              <button
                onClick={() => onComplete(mesocycle.id!)}
                className="flex-1 bg-green-600 hover:bg-green-500 text-white text-xs py-2 rounded-lg flex items-center justify-center gap-1"
              >
                <Check size={12} /> Complete
              </button>
            )}
            <button
              onClick={() => onPause(mesocycle.id!)}
              className="btn-secondary text-xs py-2 px-3 flex items-center gap-1"
            >
              <Pause size={12} /> Pause
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
