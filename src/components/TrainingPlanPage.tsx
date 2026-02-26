import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useActiveMesocycle, useAllMesocycles } from '../hooks/useMesocycle'
import { useSessionHistory } from '../hooks/useSessionHistory'
import { todayStr } from '../services/date'
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
import type { MesocycleDay } from '../services/db'
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
  ChevronRight,
  type LucideIcon
} from 'lucide-react'

const goalOptions: { value: MesocycleGoal; label: string; description: string; icon: LucideIcon }[] = [
  { value: 'strength', label: 'Strength', description: 'Max finger strength & power', icon: Zap },
  { value: 'endurance', label: 'Endurance', description: 'Work capacity & stamina', icon: TrendingUp },
  { value: 'peak', label: 'Peak', description: 'Competition or trip prep', icon: Target },
  { value: 'general', label: 'General', description: 'Well-rounded fitness', icon: Shuffle }
]

const weekOptions = [4, 6, 8]

const dayOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const dayLabels: Record<string, string> = {
  mon: 'MON', tue: 'TUE', wed: 'WED', thu: 'THU', fri: 'FRI', sat: 'SAT', sun: 'SUN'
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

const intensityBg: Record<string, string> = {
  low: 'bg-green-500/10 border-green-500/20',
  moderate: 'bg-amber-500/10 border-amber-500/20',
  hard: 'bg-orange-500/10 border-orange-500/20',
  max: 'bg-red-500/10 border-red-500/20'
}

export default function TrainingPlanPage() {
  const navigate = useNavigate()
  const activeMesocycle = useActiveMesocycle()
  const allMesocycles = useAllMesocycles()
  const lastSessions = useSessionHistory(7)

  const [view, setView] = useState<'main' | 'create' | 'preview'>('main')
  const [selectedGoal, setSelectedGoal] = useState<MesocycleGoal>('general')
  const [selectedWeeks, setSelectedWeeks] = useState(4)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedMesocyclePlan | null>(null)
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null)
  const [showPastPlans, setShowPastPlans] = useState(false)

  // Auto-expand current week
  const currentWeekNum = activeMesocycle?.currentWeek ?? null

  const todayDayIndex = new Date().getDay()
  const todayKey = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][todayDayIndex]

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
    await createMesocycle({
      name: generatedPlan.name,
      goal: selectedGoal,
      weeks: selectedWeeks,
      currentWeek: 1,
      startDate: todayStr(),
      status: 'active',
      plan: generatedPlan.weeks.map(w => ({
        weekNumber: w.weekNumber,
        theme: w.theme,
        intensity: w.intensity,
        days: w.days
      }))
    })
    setGeneratedPlan(null)
    setView('main')
  }

  const handleDayClick = (dayPlan: MesocycleDay) => {
    if (dayPlan.sessionType === 'rest') return
    navigate('/log', {
      state: {
        prefill: {
          sessionType: dayPlan.sessionType,
          durationMinutes: 60,
          exercises: dayPlan.exercises || [],
          notes: dayPlan.notes
        }
      }
    })
  }

  // Create view
  if (view === 'create') {
    return (
      <div className="space-y-4 pt-2">
        <h1 className="font-display text-xl tracking-wide text-center">NEW PLAN</h1>

        <div className="card space-y-3 p-4">
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

          <div className="text-[10px] uppercase tracking-wider text-zinc-500 mt-2">Duration</div>
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
                {weeks} weeks
              </button>
            ))}
          </div>
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
            <><Loader2 size={18} className="animate-spin" /> Generating plan...</>
          ) : (
            <><Zap size={18} /> Generate Plan</>
          )}
        </button>

        <button onClick={() => setView('main')} className="w-full text-sm text-zinc-500 hover:text-zinc-300 py-2">
          Cancel
        </button>
      </div>
    )
  }

  // Preview generated plan
  if (view === 'preview' && generatedPlan) {
    return (
      <div className="space-y-4 pt-2">
        <h1 className="font-display text-xl tracking-wide text-center">PREVIEW</h1>

        <div className="bg-gradient-to-br from-rose-600 to-rose-700 rounded-xl p-4">
          <h3 className="font-semibold text-lg">{generatedPlan.name}</h3>
          <div className="text-sm opacity-80 mt-1">
            {selectedWeeks} weeks | {goalOptions.find(g => g.value === selectedGoal)?.label} focus
          </div>
        </div>

        {generatedPlan.weeks.map((week) => (
          <WeekCard
            key={week.weekNumber}
            weekNumber={week.weekNumber}
            theme={week.theme}
            intensity={week.intensity}
            days={week.days}
            expanded={expandedWeek === week.weekNumber}
            onToggle={() => setExpandedWeek(expandedWeek === week.weekNumber ? null : week.weekNumber)}
            todayKey={null}
          />
        ))}

        <div className="flex gap-2">
          <button onClick={handleSavePlan} className="flex-1 btn-primary py-3 font-semibold flex items-center justify-center gap-2">
            <Check size={18} /> Start Plan
          </button>
          <button onClick={() => { setView('create'); setGeneratedPlan(null) }} className="flex-1 btn-secondary py-3">
            Regenerate
          </button>
        </div>
      </div>
    )
  }

  // Main view
  const pastMesocycles = allMesocycles.filter(m => m.status !== 'active')

  return (
    <div className="space-y-4 pt-2">
      <h1 className="font-display text-xl tracking-wide text-center">TRAINING PLAN</h1>

      {activeMesocycle ? (
        <>
          {/* Active plan header */}
          <div className="bg-gradient-to-br from-rose-600 to-rose-700 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{activeMesocycle.name}</h3>
                <div className="text-sm opacity-80 mt-0.5">
                  Week {activeMesocycle.currentWeek} of {activeMesocycle.weeks}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold opacity-90">
                  {Math.round((activeMesocycle.currentWeek / activeMesocycle.weeks) * 100)}%
                </div>
              </div>
            </div>
            <div className="h-1.5 bg-black/20 rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-white/30 rounded-full transition-all"
                style={{ width: `${(activeMesocycle.currentWeek / activeMesocycle.weeks) * 100}%` }}
              />
            </div>
          </div>

          {/* All weeks */}
          {activeMesocycle.plan.map((week) => {
            const isCurrent = week.weekNumber === currentWeekNum
            const isExpanded = expandedWeek === week.weekNumber || (expandedWeek === null && isCurrent)
            return (
              <WeekCard
                key={week.weekNumber}
                weekNumber={week.weekNumber}
                theme={week.theme}
                intensity={week.intensity}
                days={week.days}
                expanded={isExpanded}
                onToggle={() => setExpandedWeek(isExpanded ? -1 : week.weekNumber)}
                isCurrent={isCurrent}
                todayKey={isCurrent ? todayKey : null}
                onDayClick={isCurrent ? handleDayClick : undefined}
              />
            )
          })}

          {/* Actions */}
          <div className="flex gap-2">
            {activeMesocycle.currentWeek < activeMesocycle.weeks ? (
              <button
                onClick={() => advanceMesocycleWeek(activeMesocycle.id!)}
                className="flex-1 btn-primary text-sm py-3 flex items-center justify-center gap-2"
              >
                <ChevronRight size={16} /> Next Week
              </button>
            ) : (
              <button
                onClick={() => completeMesocycle(activeMesocycle.id!)}
                className="flex-1 bg-green-600 hover:bg-green-500 text-white text-sm py-3 rounded-xl flex items-center justify-center gap-2"
              >
                <Check size={16} /> Complete Plan
              </button>
            )}
            <button
              onClick={() => pauseMesocycle(activeMesocycle.id!)}
              className="btn-secondary text-sm py-3 px-4 flex items-center gap-2"
            >
              <Pause size={14} /> Pause
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-zinc-500 text-sm mb-4">No active training plan</p>
        </div>
      )}

      {/* Create new */}
      <button
        onClick={() => setView('create')}
        className="w-full p-4 rounded-xl bg-void-100 hover:bg-void-50 border border-violet-900/20 flex items-center justify-center gap-2 text-zinc-400 hover:text-zinc-200 transition-all"
      >
        <Plus size={18} />
        <span className="font-medium text-sm">{activeMesocycle ? 'Create New Plan' : 'Generate Training Plan'}</span>
      </button>

      {/* Past plans */}
      {pastMesocycles.length > 0 && (
        <div>
          <button
            onClick={() => setShowPastPlans(!showPastPlans)}
            className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-zinc-500 mb-2"
          >
            {showPastPlans ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            Past Plans ({pastMesocycles.length})
          </button>
          {showPastPlans && (
            <div className="space-y-2">
              {pastMesocycles.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-void-100/50 border border-violet-900/10">
                  <div>
                    <div className="font-medium text-sm">{m.name}</div>
                    <div className="text-[10px] text-zinc-500">
                      {m.weeks} weeks |{' '}
                      <span className={m.status === 'completed' ? 'text-green-400' : 'text-amber-400'}>
                        {m.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    {m.status === 'paused' && (
                      <button
                        onClick={() => resumeMesocycle(m.id!)}
                        className="p-1.5 rounded-lg bg-void-100 hover:bg-void-50 text-zinc-400 hover:text-zinc-200"
                      >
                        <Play size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteMesocycle(m.id!)}
                      className="p-1.5 rounded-lg bg-void-100 hover:bg-void-50 text-red-400/60 hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function WeekCard({
  weekNumber,
  theme,
  intensity,
  days,
  expanded,
  onToggle,
  isCurrent,
  todayKey,
  onDayClick
}: {
  weekNumber: number
  theme: string
  intensity: number
  days: Record<string, MesocycleDay>
  expanded: boolean
  onToggle: () => void
  isCurrent?: boolean
  todayKey: string | null
  onDayClick?: (dayPlan: MesocycleDay) => void
}) {
  return (
    <div className={`border rounded-xl overflow-hidden ${
      isCurrent ? 'border-rose-500/30 bg-rose-900/5' : 'border-violet-900/20'
    }`}>
      <button
        onClick={onToggle}
        className="w-full p-3 flex items-center justify-between hover:bg-void-100/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`font-bold text-sm w-8 ${isCurrent ? 'text-rose-400' : 'text-zinc-500'}`}>
            W{weekNumber}
          </div>
          <div>
            <div className="font-medium text-sm text-left">{theme}</div>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex gap-0.5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full ${
                      i < intensity ? 'bg-rose-500' : 'bg-zinc-700'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[10px] text-zinc-500">{intensity}/10</span>
            </div>
          </div>
        </div>
        {expanded ? <ChevronUp size={16} className="text-zinc-500" /> : <ChevronDown size={16} className="text-zinc-500" />}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-1.5">
          {dayOrder.filter(d => days[d]).map((day) => {
            const dayPlan = days[day]
            const DayIcon = sessionTypeIcons[dayPlan.sessionType] || Dumbbell
            const isToday = day === todayKey
            const isRest = dayPlan.sessionType === 'rest'
            const clickable = onDayClick && !isRest

            return (
              <button
                key={day}
                onClick={() => clickable && onDayClick(dayPlan)}
                disabled={!clickable}
                className={`w-full flex items-center gap-2 py-2 px-2.5 rounded-lg text-left transition-all border ${
                  isToday
                    ? 'bg-rose-500/15 border-rose-500/30'
                    : dayPlan.intensity
                    ? intensityBg[dayPlan.intensity] || 'bg-void-50/30 border-transparent'
                    : 'bg-void-50/30 border-transparent'
                } ${clickable ? 'hover:bg-rose-500/10 active:bg-rose-500/20' : ''}`}
              >
                <span className={`text-[10px] font-bold w-7 uppercase ${isToday ? 'text-rose-400' : 'text-zinc-500'}`}>
                  {dayLabels[day]}
                </span>
                <DayIcon size={14} className={isToday ? 'text-rose-400' : isRest ? 'text-zinc-600' : 'text-zinc-400'} />
                <div className="flex-1 min-w-0">
                  <span className={`text-xs font-medium ${isToday ? 'text-rose-300' : isRest ? 'text-zinc-600' : ''}`}>
                    {dayPlan.focus || dayPlan.sessionType}
                  </span>
                </div>
                {dayPlan.intensity && (
                  <span className={`text-[10px] ${intensityColors[dayPlan.intensity] || 'text-zinc-500'}`}>
                    {dayPlan.intensity}
                  </span>
                )}
                {clickable && (
                  <ChevronRight size={12} className="text-zinc-600" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
