import { useState } from 'react'
import { useRecentSessions, useDaysSinceLastSession } from '../hooks/useSessionHistory'
import { useTodayNutrition } from '../hooks/useNutrition'
import { sessionTypes } from '../data/exercises'
import Modal from './ui/Modal'
import CooldownGenerator from './CooldownGenerator'
import TodayOptions from './TodayOptions'
import type { Session } from '../services/db'
import type { DaysSinceByType } from '../services/ai'

export default function Dashboard() {
  const recentSessions = useRecentSessions(5)
  const todayNutrition = useTodayNutrition()
  const [showCooldown, setShowCooldown] = useState(false)
  const [cooldownSessionType, setCooldownSessionType] = useState<Session['type']>('boulder')

  // Get days since for each session type
  const daysSinceBoulder = useDaysSinceLastSession('boulder')
  const daysSinceLead = useDaysSinceLastSession('lead')
  const daysSinceHangboard = useDaysSinceLastSession('hangboard')
  const daysSinceSupplementary = useDaysSinceLastSession('supplementary')

  const daysSince: DaysSinceByType = {
    boulder: daysSinceBoulder,
    lead: daysSinceLead,
    hangboard: daysSinceHangboard,
    supplementary: daysSinceSupplementary
  }

  const handleQuickCooldown = (type: Session['type']) => {
    setCooldownSessionType(type)
    setShowCooldown(true)
  }

  return (
    <div className="space-y-6">
      <header className="text-center py-4">
        <h1 className="text-2xl font-bold">Climbing Companion</h1>
        <p className="text-gray-400 text-sm">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </header>

      <TodayOptions daysSince={daysSince} />

      <section className="card">
        <h2 className="text-lg font-semibold mb-4">Days Since Last Session</h2>
        <div className="grid grid-cols-2 gap-3">
          {sessionTypes.map((type) => (
            <DaysSinceCard key={type.value} type={type.value} label={type.label} emoji={type.emoji} />
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold mb-3">Quick Cooldown</h2>
        <p className="text-gray-400 text-sm mb-3">Generate a stretch routine for any session type</p>
        <div className="grid grid-cols-2 gap-2">
          {sessionTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => handleQuickCooldown(type.value)}
              className="p-3 bg-gradient-to-r from-teal-600/50 to-cyan-600/50 hover:from-teal-600 hover:to-cyan-600 rounded-lg transition-colors flex items-center gap-2"
            >
              <span className="text-lg">{type.emoji}</span>
              <span className="text-sm">{type.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold mb-4">Today's Nutrition</h2>
        {todayNutrition ? (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Protein</span>
              <span className="font-mono">{todayNutrition.proteinTotal}g</span>
            </div>
            <div className="flex justify-between">
              <span>Points</span>
              <span className="font-mono text-green-400">{todayNutrition.veganPoints}</span>
            </div>
            <div className="flex justify-between">
              <span>Meals logged</span>
              <span className="font-mono">{todayNutrition.meals.length}</span>
            </div>
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No meals logged today</p>
        )}
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold mb-4">Recent Sessions</h2>
        {recentSessions.length > 0 ? (
          <ul className="space-y-2">
            {recentSessions.map((session) => (
              <li key={session.id} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
                <div>
                  <span className="mr-2">
                    {sessionTypes.find((t) => t.value === session.type)?.emoji}
                  </span>
                  <span className="capitalize">{session.type}</span>
                </div>
                <div className="text-gray-400 text-sm">
                  {new Date(session.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400 text-sm">No sessions logged yet</p>
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
  emoji
}: {
  type: 'boulder' | 'lead' | 'hangboard' | 'supplementary'
  label: string
  emoji: string
}) {
  const days = useDaysSinceLastSession(type)

  return (
    <div className="bg-gray-700 rounded-lg p-3 text-center">
      <div className="text-2xl mb-1">{emoji}</div>
      <div className="text-2xl font-bold">
        {days === null ? '-' : days === 0 ? 'Today' : days}
      </div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  )
}
