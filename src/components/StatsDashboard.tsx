import { useState, useMemo } from 'react'
import { useSessionsByDateRange } from '../hooks/useSessionHistory'
import { sessionTypes } from '../data/exercises'
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

const typeColors: Record<string, string> = {
  boulder: 'bg-rose-500',
  lead: 'bg-violet-500',
  hangboard: 'bg-pink-500',
  gym: 'bg-amber-500',
  cardio: 'bg-green-500',
  hiit: 'bg-orange-500',
  crossfit: 'bg-red-500',
  mobility: 'bg-teal-500',
  core: 'bg-blue-500'
}

type Period = '7d' | '30d' | '90d'

function getDateRange(period: Period): { start: string; end: string } {
  const end = new Date()
  const start = new Date()
  switch (period) {
    case '7d': start.setDate(start.getDate() - 7); break
    case '30d': start.setDate(start.getDate() - 30); break
    case '90d': start.setDate(start.getDate() - 90); break
  }
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  }
}

export default function StatsDashboard() {
  const [period, setPeriod] = useState<Period>('30d')
  const { start, end } = getDateRange(period)
  const sessions = useSessionsByDateRange(start, end)

  const stats = useMemo(() => {
    if (sessions.length === 0) return null

    const totalSessions = sessions.length
    const totalMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0)
    const totalHours = Math.round(totalMinutes / 6) / 10

    // Most frequent type
    const typeCounts: Record<string, number> = {}
    for (const s of sessions) {
      typeCounts[s.type] = (typeCounts[s.type] || 0) + 1
    }
    const mostFrequentType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'gym'

    // Current streak
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const sessionDates = new Set(sessions.map(s => s.date))
    let streak = 0
    const checkDate = new Date(today)
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0]
      if (sessionDates.has(dateStr)) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }

    // Type distribution
    const distribution = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({
        type,
        count,
        pct: Math.round((count / totalSessions) * 100)
      }))

    // Weekly volume (last 7 days)
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const weeklyVolume = days.map((day, i) => {
      const d = new Date(today)
      const todayDay = (today.getDay() + 6) % 7  // Mon=0
      d.setDate(d.getDate() - todayDay + i)
      const dateStr = d.toISOString().split('T')[0]
      const daySessions = sessions.filter(s => s.date === dateStr)
      return {
        day,
        minutes: daySessions.reduce((sum, s) => sum + s.durationMinutes, 0)
      }
    })
    const maxMinutes = Math.max(...weeklyVolume.map(d => d.minutes), 1)

    // Training heatmap (last 30 days)
    const heatmap: { date: string; count: number }[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const count = sessions.filter(s => s.date === dateStr).length
      heatmap.push({ date: dateStr, count })
    }

    return {
      totalSessions,
      totalHours,
      mostFrequentType,
      streak,
      distribution,
      weeklyVolume,
      maxMinutes,
      heatmap
    }
  }, [sessions])

  if (!stats) {
    return (
      <div className="text-center py-6 text-zinc-500 text-sm">
        No sessions in this period
      </div>
    )
  }

  const FreqIcon = sessionIcons[stats.mostFrequentType] || Dumbbell
  const freqLabel = sessionTypes.find(t => t.value === stats.mostFrequentType)?.label || stats.mostFrequentType

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex gap-1.5">
        {([['7d', 'Week'], ['30d', 'Month'], ['90d', '90 Days']] as [Period, string][]).map(([p, label]) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
              period === p
                ? 'bg-rose-500 text-white'
                : 'bg-void-100 text-zinc-500 hover:text-zinc-300 border border-violet-900/20'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-void-100/50 rounded-xl p-3 text-center border border-violet-900/10">
          <div className="text-xl font-bold text-rose-400">{stats.totalSessions}</div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wide">Sessions</div>
        </div>
        <div className="bg-void-100/50 rounded-xl p-3 text-center border border-violet-900/10">
          <div className="text-xl font-bold text-amber-400">{stats.totalHours}h</div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wide">Duration</div>
        </div>
        <div className="bg-void-100/50 rounded-xl p-3 text-center border border-violet-900/10">
          <FreqIcon size={20} className="mx-auto text-violet-400 mb-0.5" />
          <div className="text-[10px] text-zinc-500 uppercase tracking-wide">{freqLabel}</div>
        </div>
        <div className="bg-void-100/50 rounded-xl p-3 text-center border border-violet-900/10">
          <div className="text-xl font-bold text-accent-400">{stats.streak}</div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wide">Streak</div>
        </div>
      </div>

      {/* Type distribution */}
      {stats.distribution.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Session Types</div>
          <div className="h-3 rounded-full overflow-hidden flex">
            {stats.distribution.map(({ type, pct }) => (
              <div
                key={type}
                className={`${typeColors[type] || 'bg-zinc-600'} transition-all`}
                style={{ width: `${Math.max(pct, 2)}%` }}
                title={`${type}: ${pct}%`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
            {stats.distribution.map(({ type, pct }) => (
              <div key={type} className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${typeColors[type] || 'bg-zinc-600'}`} />
                <span className="text-[10px] text-zinc-500">{sessionTypes.find(t => t.value === type)?.label || type} {pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly volume chart */}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">This Week</div>
        <div className="flex items-end gap-1 h-16">
          {stats.weeklyVolume.map(({ day, minutes }) => (
            <div key={day} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-gradient-to-t from-rose-600 to-rose-400 transition-all min-h-[2px]"
                style={{ height: `${(minutes / stats.maxMinutes) * 100}%` }}
              />
              <span className="text-[9px] text-zinc-600">{day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 30-day heatmap */}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Last 30 Days</div>
        <div className="grid grid-cols-10 gap-1">
          {stats.heatmap.map(({ date, count }) => (
            <div
              key={date}
              className={`aspect-square rounded-sm ${
                count === 0 ? 'bg-void-100'
                : count === 1 ? 'bg-rose-500/30'
                : 'bg-rose-500/60'
              }`}
              title={`${date}: ${count} session${count !== 1 ? 's' : ''}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
