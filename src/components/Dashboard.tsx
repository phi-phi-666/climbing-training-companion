import { useState } from 'react'
import { useRecentSessions, useDaysSinceLastSession, useHasSessionToday } from '../hooks/useSessionHistory'
import { sessionTypes, boulderSubTypes, cardioSubTypes } from '../data/exercises'
import Modal from './ui/Modal'
import CooldownGenerator from './CooldownGenerator'
import TodayOptions from './TodayOptions'
import type { Session } from '../services/db'
import type { DaysSinceByType } from '../services/ai'
import {
  Mountain,
  Dumbbell,
  Hand,
  Flame,
  Footprints,
  Zap,
  StretchHorizontal,
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
  const [showCooldown, setShowCooldown] = useState(false)
  const [cooldownSessionType, setCooldownSessionType] = useState<Session['type']>('boulder')

  // Get days since for each session type
  const daysSinceBoulder = useDaysSinceLastSession('boulder')
  const daysSinceLead = useDaysSinceLastSession('lead')
  const daysSinceHangboard = useDaysSinceLastSession('hangboard')
  const daysSinceGym = useDaysSinceLastSession('gym')
  const daysSinceCardio = useDaysSinceLastSession('cardio')
  const daysSinceHiit = useDaysSinceLastSession('hiit')
  const daysSinceCrossfit = useDaysSinceLastSession('crossfit')
  const daysSinceMobility = useDaysSinceLastSession('mobility')

  const daysSince: DaysSinceByType = {
    boulder: daysSinceBoulder,
    lead: daysSinceLead,
    hangboard: daysSinceHangboard,
    gym: daysSinceGym,
    cardio: daysSinceCardio,
    hiit: daysSinceHiit,
    crossfit: daysSinceCrossfit,
    mobility: daysSinceMobility
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
    <div className="space-y-6">
      <header className="text-center py-6">
        <h1 className="text-3xl font-bold tracking-tight text-rose-400">Alpha</h1>
        <p className="text-stone-500 text-sm mt-1">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </header>

      <TodayOptions daysSince={daysSince} hasSessionToday={hasSessionToday} />

      <section className="card">
        <h2 className="text-lg font-semibold mb-4">Days Since Last Session</h2>
        <div className="grid grid-cols-2 gap-3">
          {sessionTypes.map((type) => {
            const Icon = sessionIcons[type.value]
            return (
              <DaysSinceCard key={type.value} type={type.value} label={type.label} Icon={Icon} />
            )
          })}
        </div>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold mb-3">Quick Cooldown</h2>
        <p className="text-stone-500 text-sm mb-3">Generate a stretch routine for any session type</p>
        <div className="grid grid-cols-2 gap-2">
          {sessionTypes.map((type) => {
            const Icon = sessionIcons[type.value]
            return (
              <button
                key={type.value}
                onClick={() => handleQuickCooldown(type.value)}
                className="p-3 bg-gradient-to-r from-accent-700/50 to-accent-600/50 hover:from-accent-600 hover:to-accent-500 rounded-xl transition-all flex items-center gap-2 border border-accent-700/30"
              >
                <Icon size={20} strokeWidth={1.5} />
                <span className="text-sm font-medium">{type.label}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold mb-4">Recent Sessions</h2>
        {recentSessions.length > 0 ? (
          <ul className="space-y-2">
            {recentSessions.map((session) => {
              const Icon = sessionIcons[session.type]
              return (
                <li key={session.id} className="flex justify-between items-center py-3 border-b border-stone-800 last:border-0">
                  <div className="flex items-center gap-2">
                    <Icon size={20} strokeWidth={1.5} className="text-rose-400" />
                    <span className="font-medium">{getSessionDisplayLabel(session)}</span>
                  </div>
                  <div className="text-stone-500 text-sm">
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
          <p className="text-stone-500 text-sm text-center py-4">No sessions logged yet</p>
        )}
      </section>

      <Modal
        isOpen={showCooldown}
        onClose={() => setShowCooldown(false)}
        title="AI Cooldown Generator"
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

  return (
    <div className="bg-stone-800/50 rounded-xl p-3 text-center border border-stone-700/50">
      <div className="flex justify-center mb-1">
        <Icon size={28} strokeWidth={1.5} className="text-stone-400" />
      </div>
      <div className="text-2xl font-bold text-rose-400">
        {days === null ? '-' : days === 0 ? 'Today' : days}
      </div>
      <div className="text-xs text-stone-500 font-medium">{label}</div>
    </div>
  )
}
