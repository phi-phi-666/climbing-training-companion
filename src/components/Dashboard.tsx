import { useState } from 'react'
import { useRecentSessions, useDaysSinceLastSession, useHasSessionToday } from '../hooks/useSessionHistory'
import { sessionTypes, boulderSubTypes, cardioSubTypes } from '../data/exercises'
import Modal from './ui/Modal'
import Accordion from './ui/Accordion'
import WarmupGenerator from './WarmupGenerator'
import CooldownGenerator from './CooldownGenerator'
import SmartSchedule from './SmartSchedule'
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
  Sparkles,
  Sun,
  Clock,
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
  const [showWarmup, setShowWarmup] = useState(false)
  const [warmupSessionType, setWarmupSessionType] = useState<Session['type']>('boulder')
  const [showCooldown, setShowCooldown] = useState(false)
  const [cooldownSessionType, setCooldownSessionType] = useState<Session['type']>('boulder')

  const handleQuickWarmup = (type: Session['type']) => {
    setWarmupSessionType(type)
    setShowWarmup(true)
  }

  const handleQuickCooldown = (type: Session['type']) => {
    setCooldownSessionType(type)
    setShowCooldown(true)
  }

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

      {/* Smart Schedule - Main feature */}
      <SmartSchedule hasSessionToday={hasSessionToday} />

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

      {/* Quick Warmup - Accordion */}
      <Accordion
        title="QUICK WARMUP"
        icon={<Sun size={18} />}
        defaultOpen={false}
      >
        <div className="grid grid-cols-4 gap-2">
          {sessionTypes.map((type) => {
            const Icon = sessionIcons[type.value]
            return (
              <button
                key={type.value}
                onClick={() => handleQuickWarmup(type.value)}
                className="p-3 bg-rose-900/30 hover:bg-rose-800/40 rounded-xl transition-all flex flex-col items-center gap-1 border border-rose-700/20 group"
              >
                <Icon size={20} strokeWidth={1.5} className="text-rose-400 group-hover:text-rose-300" />
                <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-300">{type.label}</span>
              </button>
            )
          })}
        </div>
      </Accordion>

      {/* Quick Cooldown - Accordion */}
      <Accordion
        title="QUICK COOLDOWN"
        icon={<Sparkles size={18} />}
        defaultOpen={false}
      >
        <div className="grid grid-cols-4 gap-2">
          {sessionTypes.map((type) => {
            const Icon = sessionIcons[type.value]
            return (
              <button
                key={type.value}
                onClick={() => handleQuickCooldown(type.value)}
                className="p-3 bg-accent-900/30 hover:bg-accent-800/40 rounded-xl transition-all flex flex-col items-center gap-1 border border-accent-700/20 group"
              >
                <Icon size={20} strokeWidth={1.5} className="text-accent-400 group-hover:text-accent-300" />
                <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-300">{type.label}</span>
              </button>
            )
          })}
        </div>
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
        isOpen={showWarmup}
        onClose={() => setShowWarmup(false)}
        title="AI Warmup"
      >
        <WarmupGenerator
          sessionType={warmupSessionType}
          onClose={() => setShowWarmup(false)}
        />
      </Modal>

      <Modal
        isOpen={showCooldown}
        onClose={() => setShowCooldown(false)}
        title="AI Cooldown"
      >
        <CooldownGenerator
          sessionType={cooldownSessionType}
          onClose={() => setShowCooldown(false)}
        />
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
