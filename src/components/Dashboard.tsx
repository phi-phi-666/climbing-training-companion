import { useState } from 'react'
import { useRecentSessions, useDaysSinceLastSession, useHasSessionToday } from '../hooks/useSessionHistory'
import { useActiveMesocycle } from '../hooks/useMesocycle'
import { sessionTypes, boulderSubTypes, cardioSubTypes } from '../data/exercises'
import Modal from './ui/Modal'
import Accordion from './ui/Accordion'
import SmartSchedule from './SmartSchedule'
import StatsDashboard from './StatsDashboard'
import MesocyclePlanner from './MesocyclePlanner'
import type { Session } from '../services/db'
import {
  Mountain,
  Dumbbell,
  Hand,
  Flame,
  Footprints,
  Zap,
  StretchHorizontal,
  Timer,
  Clock,
  BarChart2,
  CalendarRange,
  Coffee,
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

export default function Dashboard() {
  const recentSessions = useRecentSessions(5)
  const hasSessionToday = useHasSessionToday()
  const [showMesocyclePlanner, setShowMesocyclePlanner] = useState(false)
  const activeMesocycle = useActiveMesocycle()

  // Get display label for session including boulder/cardio sub-type
  const getSessionDisplayLabel = (session: Session) => {
    if (session.type === 'boulder' && session.boulderSubType) {
      const subType = boulderSubTypes.find(t => t.value === session.boulderSubType)
      return `Boulder - ${subType?.label || session.boulderSubType}`
    }
    if (session.type === 'cardio' && session.cardioSubType) {
      const subType = cardioSubTypes.find(t => t.value === session.cardioSubType)
      return `Cardio - ${subType?.label || session.cardioSubType}`
    }
    const type = sessionTypes.find(t => t.value === session.type)
    return type?.label || session.type
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <header className="text-center py-6">
        <h1 className="font-display text-5xl tracking-wider text-rose-400">ALPHA</h1>
        <p className="text-zinc-500 text-sm mt-2 tracking-wide">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </header>

      {/* Active Mesocycle Card */}
      {activeMesocycle && (
        <button
          onClick={() => setShowMesocyclePlanner(true)}
          className="w-full bg-gradient-to-r from-rose-900/40 to-violet-900/40 border border-rose-500/20 rounded-xl p-4 text-left hover:from-rose-900/50 hover:to-violet-900/50 transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CalendarRange size={16} className="text-rose-400" />
              <span className="font-semibold text-sm">{activeMesocycle.name}</span>
            </div>
            <span className="text-[10px] text-zinc-500">
              Week {activeMesocycle.currentWeek}/{activeMesocycle.weeks}
            </span>
          </div>
          <div className="h-1.5 bg-void-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-rose-400 rounded-full transition-all"
              style={{ width: `${(activeMesocycle.currentWeek / activeMesocycle.weeks) * 100}%` }}
            />
          </div>
          {(() => {
            const dayIndex = new Date().getDay()
            const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
            const todayKey = dayKeys[dayIndex]
            const currentWeekPlan = activeMesocycle.plan.find(w => w.weekNumber === activeMesocycle.currentWeek)
            const todayPlan = currentWeekPlan?.days[todayKey]
            if (!todayPlan) return null
            const SessionIcon = ({
              boulder: Mountain, lead: Mountain, hangboard: Hand, gym: Dumbbell,
              cardio: Footprints, hiit: Flame, crossfit: Zap, mobility: StretchHorizontal,
              rest: Coffee
            } as Record<string, LucideIcon>)[todayPlan.sessionType] || Dumbbell
            return (
              <div className="mt-2 flex items-center gap-2 text-xs text-zinc-400">
                <SessionIcon size={12} />
                <span>Today: {todayPlan.focus || todayPlan.sessionType}</span>
              </div>
            )
          })()}
        </button>
      )}

      {/* Smart Schedule - Main feature */}
      <SmartSchedule hasSessionToday={hasSessionToday} />

      {/* Stats Dashboard */}
      <Accordion
        title="STATS"
        icon={<BarChart2 size={18} />}
        defaultOpen={false}
      >
        <StatsDashboard />
      </Accordion>

      {/* Days Since - Accordion */}
      <Accordion
        title="DAYS SINCE"
        icon={<Timer size={18} />}
        defaultOpen={false}
      >
        <div className="grid grid-cols-4 gap-2">
          {sessionTypes.map((type) => {
            const Icon = sessionIcons[type.value]
            return (
              <DaysSinceCard key={type.value} type={type.value} label={type.label} Icon={Icon} />
            )
          })}
        </div>
      </Accordion>

      {/* Training Plan - Accordion */}
      <Accordion
        title="TRAINING PLAN"
        icon={<CalendarRange size={18} />}
        badge={activeMesocycle ? `W${activeMesocycle.currentWeek}` : undefined}
        defaultOpen={false}
      >
        <MesocyclePlanner onClose={() => {}} />
      </Accordion>

      {/* Recent Sessions - Accordion */}
      <Accordion
        title="RECENT"
        icon={<Clock size={18} />}
        badge={recentSessions.length}
        defaultOpen={false}
      >
        {recentSessions.length > 0 ? (
          <ul className="space-y-1">
            {recentSessions.map((session) => {
              const Icon = sessionIcons[session.type] || Dumbbell
              return (
                <li key={session.id} className="flex justify-between items-center py-3 px-3 rounded-lg hover:bg-void-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    {Icon && <Icon size={18} strokeWidth={1.5} className="text-rose-400" />}
                    <span className="font-medium text-sm">{getSessionDisplayLabel(session)}</span>
                  </div>
                  <div className="text-zinc-500 text-xs">
                    {new Date(session.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-zinc-500 text-sm text-center py-4">No sessions logged yet</p>
        )}
      </Accordion>

      <Modal
        isOpen={showMesocyclePlanner}
        onClose={() => setShowMesocyclePlanner(false)}
        title="Training Plan"
      >
        <MesocyclePlanner onClose={() => setShowMesocyclePlanner(false)} />
      </Modal>
    </div>
  )
}

function DaysSinceCard({
  type,
  label,
  Icon
}: {
  type: Session['type']
  label: string
  Icon: LucideIcon
}) {
  const days = useDaysSinceLastSession(type)

  // Color based on days
  const getColor = () => {
    if (days === null) return 'text-zinc-600'
    if (days === 0) return 'text-accent-400'
    if (days <= 2) return 'text-rose-400'
    if (days <= 5) return 'text-amber-400'
    return 'text-zinc-400'
  }

  return (
    <div className="bg-void-100/50 rounded-xl p-3 text-center border border-violet-900/10 hover:border-violet-800/30 transition-colors">
      <Icon size={20} strokeWidth={1.5} className="mx-auto text-zinc-500 mb-1" />
      <div className={`text-lg font-bold ${getColor()}`}>
        {days === null ? '—' : days === 0 ? '✓' : days}
      </div>
      <div className="text-[10px] text-zinc-500 font-medium tracking-wide uppercase">{label}</div>
    </div>
  )
}
