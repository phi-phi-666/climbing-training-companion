import { useState, useEffect } from 'react'
import {
  getScheduleConfig,
  saveScheduleConfig,
  getDayName,
  type ScheduleConfig,
  type DayOfWeek,
  type ClimbingType
} from '../services/schedule'
import {
  Mountain,
  Calendar,
  Dumbbell,
  Plus,
  X,
  Check,
  ChevronRight,
  Settings as SettingsIcon
} from 'lucide-react'

const DAYS: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6]

export default function Settings() {
  const [config, setConfig] = useState<ScheduleConfig>(getScheduleConfig)
  const [editingEquipment, setEditingEquipment] = useState(false)
  const [newEquipment, setNewEquipment] = useState('')
  const [saved, setSaved] = useState(false)

  // Save whenever config changes
  useEffect(() => {
    saveScheduleConfig(config)
    setSaved(true)
    const timer = setTimeout(() => setSaved(false), 1500)
    return () => clearTimeout(timer)
  }, [config])

  const toggleClimbingDay = (day: DayOfWeek, type: ClimbingType) => {
    const existing = config.climbingDays.find(d => d.dayOfWeek === day)

    if (existing) {
      if (existing.type === type && !existing.alternateType) {
        // Remove this day entirely
        setConfig({
          ...config,
          climbingDays: config.climbingDays.filter(d => d.dayOfWeek !== day)
        })
      } else if (existing.type === type) {
        // Has alternate, just remove the main type
        setConfig({
          ...config,
          climbingDays: config.climbingDays.map(d =>
            d.dayOfWeek === day
              ? { ...d, type: d.alternateType!, alternateType: undefined, alternateProbability: undefined }
              : d
          )
        })
      } else {
        // Different type, replace it
        setConfig({
          ...config,
          climbingDays: config.climbingDays.map(d =>
            d.dayOfWeek === day ? { ...d, type } : d
          )
        })
      }
    } else {
      // Add new climbing day
      setConfig({
        ...config,
        climbingDays: [...config.climbingDays, { dayOfWeek: day, type }]
      })
    }
  }

  const setAlternateType = (day: DayOfWeek, alternateType: ClimbingType | null, probability: number = 0.2) => {
    setConfig({
      ...config,
      climbingDays: config.climbingDays.map(d => {
        if (d.dayOfWeek !== day) return d
        if (alternateType === null) {
          return { dayOfWeek: d.dayOfWeek, type: d.type }
        }
        return { ...d, alternateType, alternateProbability: probability }
      })
    })
  }

  const addEquipment = () => {
    if (newEquipment.trim() && !config.homeEquipment.includes(newEquipment.trim().toLowerCase())) {
      setConfig({
        ...config,
        homeEquipment: [...config.homeEquipment, newEquipment.trim().toLowerCase()]
      })
      setNewEquipment('')
    }
  }

  const removeEquipment = (item: string) => {
    setConfig({
      ...config,
      homeEquipment: config.homeEquipment.filter(e => e !== item)
    })
  }

  const getClimbingDayInfo = (day: DayOfWeek) => {
    return config.climbingDays.find(d => d.dayOfWeek === day)
  }

  return (
    <div className="space-y-6 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SettingsIcon size={20} className="text-violet-400" />
          <h1 className="font-display text-2xl tracking-wide">SETTINGS</h1>
        </div>
        {saved && (
          <span className="text-accent-400 text-xs flex items-center gap-1">
            <Check size={12} /> Saved
          </span>
        )}
      </div>

      {/* Weekly Schedule */}
      <div className="card">
        <h2 className="font-display text-lg tracking-wide mb-4 flex items-center gap-2">
          <Calendar size={18} className="text-rose-400" />
          CLIMBING SCHEDULE
        </h2>

        <div className="space-y-2">
          {DAYS.map(day => {
            const info = getClimbingDayInfo(day)
            const isBoulder = info?.type === 'boulder'
            const isLead = info?.type === 'lead'
            const hasAlternate = !!info?.alternateType

            return (
              <div
                key={day}
                className="flex items-center justify-between p-3 bg-void-100 rounded-xl border border-violet-900/20"
              >
                <span className="font-medium text-sm w-24">{getDayName(day)}</span>

                <div className="flex items-center gap-2">
                  {/* Boulder toggle */}
                  <button
                    onClick={() => toggleClimbingDay(day, 'boulder')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                      isBoulder
                        ? 'bg-rose-500 text-white'
                        : 'bg-void-50 text-zinc-500 hover:text-zinc-300 border border-violet-900/20'
                    }`}
                  >
                    <Mountain size={12} />
                    Boulder
                  </button>

                  {/* Lead toggle */}
                  <button
                    onClick={() => toggleClimbingDay(day, 'lead')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                      isLead
                        ? 'bg-violet-500 text-white'
                        : 'bg-void-50 text-zinc-500 hover:text-zinc-300 border border-violet-900/20'
                    }`}
                  >
                    <Mountain size={12} />
                    Lead
                  </button>

                  {/* Alternate type (only show if there's a primary type) */}
                  {info && (
                    <button
                      onClick={() => {
                        if (hasAlternate) {
                          setAlternateType(day, null)
                        } else {
                          setAlternateType(day, info.type === 'boulder' ? 'lead' : 'boulder', 0.2)
                        }
                      }}
                      className={`px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                        hasAlternate
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-void-50 text-zinc-600 hover:text-zinc-400 border border-violet-900/20'
                      }`}
                      title={hasAlternate ? `20% chance: ${info.alternateType}` : 'Add alternate type'}
                    >
                      {hasAlternate ? `+${Math.round((info.alternateProbability || 0.2) * 100)}%` : '±'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <p className="text-xs text-zinc-500 mt-3">
          Tap Boulder or Lead to set climbing days. Use ± to add an alternate type (e.g., 80% lead, 20% boulder).
        </p>
      </div>

      {/* Home Equipment */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg tracking-wide flex items-center gap-2">
            <Dumbbell size={18} className="text-rose-400" />
            HOME EQUIPMENT
          </h2>
          <button
            onClick={() => setEditingEquipment(!editingEquipment)}
            className="text-xs text-rose-400 hover:text-rose-300"
          >
            {editingEquipment ? 'Done' : 'Edit'}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {config.homeEquipment.map(item => (
            <div
              key={item}
              className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 ${
                editingEquipment
                  ? 'bg-red-900/20 border border-red-800/30'
                  : 'bg-void-100 border border-violet-900/20'
              }`}
            >
              <span className="capitalize">{item}</span>
              {editingEquipment && (
                <button
                  onClick={() => removeEquipment(item)}
                  className="text-red-400 hover:text-red-300"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        {editingEquipment && (
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={newEquipment}
              onChange={(e) => setNewEquipment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addEquipment()}
              placeholder="Add equipment..."
              className="flex-1 bg-void-100 border border-violet-900/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-500/50"
            />
            <button
              onClick={addEquipment}
              disabled={!newEquipment.trim()}
              className="px-3 py-2 bg-rose-500 hover:bg-rose-400 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>
        )}

        <p className="text-xs text-zinc-500 mt-3">
          Equipment available for home workouts. Used by AI to suggest exercises.
        </p>
      </div>

      {/* Week Preview */}
      <div className="card">
        <h2 className="font-display text-lg tracking-wide mb-4 flex items-center gap-2">
          <Calendar size={18} className="text-rose-400" />
          THIS WEEK
        </h2>

        <WeekPreview config={config} />
      </div>

      {/* Info */}
      <div className="card bg-violet-900/10 border-violet-800/30">
        <h3 className="text-sm font-semibold mb-2 text-violet-300">How it works</h3>
        <ul className="text-xs text-zinc-400 space-y-1">
          <li className="flex items-start gap-2">
            <ChevronRight size={12} className="mt-0.5 text-violet-400" />
            <span>On climbing days, you'll see "What Now?" with session ideas</span>
          </li>
          <li className="flex items-start gap-2">
            <ChevronRight size={12} className="mt-0.5 text-violet-400" />
            <span>On rest days, you'll see "What's Next?" with workout options</span>
          </li>
          <li className="flex items-start gap-2">
            <ChevronRight size={12} className="mt-0.5 text-violet-400" />
            <span>Hangboard is blocked for 24h after climbing (injury prevention)</span>
          </li>
          <li className="flex items-start gap-2">
            <ChevronRight size={12} className="mt-0.5 text-violet-400" />
            <span>You can override the schedule for any day from the home screen</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

function WeekPreview({ config }: { config: ScheduleConfig }) {
  const today = new Date()
  const currentDayOfWeek = today.getDay() as DayOfWeek

  // Get the start of this week (Sunday)
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - currentDayOfWeek)

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek)
    date.setDate(startOfWeek.getDate() + i)
    const dayOfWeek = i as DayOfWeek
    const climbingDay = config.climbingDays.find(d => d.dayOfWeek === dayOfWeek)
    const isToday = i === currentDayOfWeek
    const dateStr = date.toISOString().split('T')[0]
    const override = config.overrides.find(o => o.date === dateStr)

    return {
      dayOfWeek,
      date,
      climbingDay,
      isToday,
      override
    }
  })

  return (
    <div className="grid grid-cols-7 gap-1">
      {days.map(({ dayOfWeek, date, climbingDay, isToday, override }) => {
        let bgColor = 'bg-void-100'
        let textColor = 'text-zinc-500'
        let icon = null

        if (override?.skipClimbing) {
          bgColor = 'bg-zinc-800/50'
          textColor = 'text-zinc-600'
        } else if (override?.forceClimbing || climbingDay) {
          const type = override?.forceClimbing || climbingDay?.type
          if (type === 'boulder') {
            bgColor = 'bg-rose-500/20'
            textColor = 'text-rose-400'
            icon = <Mountain size={12} />
          } else if (type === 'lead') {
            bgColor = 'bg-violet-500/20'
            textColor = 'text-violet-400'
            icon = <Mountain size={12} />
          }
        }

        return (
          <div
            key={dayOfWeek}
            className={`p-2 rounded-lg text-center ${bgColor} ${isToday ? 'ring-2 ring-rose-500/50' : ''}`}
          >
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
              {getDayName(dayOfWeek).slice(0, 3)}
            </div>
            <div className={`text-sm font-semibold ${textColor}`}>
              {date.getDate()}
            </div>
            {icon && (
              <div className={`flex justify-center mt-1 ${textColor}`}>
                {icon}
              </div>
            )}
            {override && (
              <div className="text-[8px] text-amber-400 mt-0.5">mod</div>
            )}
          </div>
        )
      })}
    </div>
  )
}
