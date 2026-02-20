import { useSessionHistory, deleteSession, updateSession, type Session } from '../hooks/useSessionHistory'
import { sessionTypes, boulderSubTypes, cardioSubTypes } from '../data/exercises'
import { useState } from 'react'
import {
  Mountain,
  Dumbbell,
  Hand,
  Flame,
  Footprints,
  Zap,
  StretchHorizontal,
  ChevronUp,
  ChevronDown,
  CalendarDays,
  Trash2,
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

function getDateOptions(): { value: string; label: string }[] {
  const options = []
  const today = new Date()

  for (let i = 0; i < 14; i++) {
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

export default function History() {
  const sessions = useSessionHistory(30)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [editingDateId, setEditingDateId] = useState<number | null>(null)

  const groupedSessions = sessions.reduce(
    (acc, session) => {
      const date = session.date
      if (!acc[date]) acc[date] = []
      acc[date].push(session)
      return acc
    },
    {} as Record<string, Session[]>
  )

  const handleDelete = async (id: number) => {
    if (confirm('Delete this session?')) {
      await deleteSession(id)
      setExpandedId(null)
    }
  }

  const handleDateChange = async (id: number, newDate: string) => {
    await updateSession(id, { date: newDate })
    setEditingDateId(null)
  }

  const getSessionLabel = (session: Session) => {
    const typeInfo = sessionTypes.find((t) => t.value === session.type)
    if (session.type === 'boulder' && session.boulderSubType) {
      const subType = boulderSubTypes.find(t => t.value === session.boulderSubType)
      return `${typeInfo?.label} - ${subType?.label}`
    }
    if (session.type === 'cardio' && session.cardioSubType) {
      const subType = cardioSubTypes.find(t => t.value === session.cardioSubType)
      return `${typeInfo?.label} - ${subType?.label}`
    }
    return typeInfo?.label || session.type
  }

  const dateOptions = getDateOptions()

  return (
    <div className="space-y-3 pt-2">
      {/* Summary bar */}
      <div className="flex items-center justify-between px-1">
        <span className="text-zinc-500 text-sm">Last 30 days</span>
        <span className="text-zinc-400 text-sm font-medium">{sessions.length} {sessions.length === 1 ? 'session' : 'sessions'}</span>
      </div>

      {sessions.length === 0 ? (
        <div className="card text-center py-12">
          <CalendarDays size={48} strokeWidth={1} className="mx-auto text-zinc-600 mb-4" />
          <p className="text-zinc-400">No sessions recorded yet</p>
          <p className="text-zinc-500 text-sm mt-2">Start logging your training!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(groupedSessions).map(([date, daySessions]) => (
            <div key={date} className="card">
              <h2 className="text-xs font-medium text-zinc-500 mb-3 tracking-wide uppercase">
                {new Date(date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric'
                })}
              </h2>
              <div className="space-y-2">
                {daySessions.map((session) => {
                  const Icon = sessionIcons[session.type] || Dumbbell
                  const isExpanded = expandedId === session.id
                  const isEditingDate = editingDateId === session.id

                  return (
                    <div
                      key={session.id}
                      className="bg-void-100 rounded-xl overflow-hidden border border-violet-900/20"
                    >
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : session.id!)}
                        className="w-full p-3 flex items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-3">
                          <Icon size={20} strokeWidth={1.5} className="text-rose-400" />
                          <div>
                            <div className="font-medium text-sm">{getSessionLabel(session)}</div>
                            <div className="text-xs text-zinc-500">
                              {session.durationMinutes}m
                              {session.exercises.length > 0 && (
                                <span> · {session.exercises.length} exercises</span>
                              )}
                            </div>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp size={18} strokeWidth={1.5} className="text-zinc-500" />
                        ) : (
                          <ChevronDown size={18} strokeWidth={1.5} className="text-zinc-500" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="px-3 pb-3 border-t border-violet-900/20 pt-3 space-y-3">
                          {/* Date Edit Section */}
                          <div>
                            <div className="text-[10px] text-zinc-500 mb-1.5 font-medium uppercase tracking-wider flex items-center gap-1">
                              <CalendarDays size={10} />
                              Date
                            </div>
                            {isEditingDate ? (
                              <div className="flex flex-wrap gap-1.5">
                                {dateOptions.map((option) => (
                                  <button
                                    key={option.value}
                                    onClick={() => handleDateChange(session.id!, option.value)}
                                    className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                                      session.date === option.value
                                        ? 'bg-rose-500 text-white'
                                        : 'bg-void-50 text-zinc-400 hover:text-zinc-200 border border-violet-900/20'
                                    }`}
                                  >
                                    {option.label}
                                  </button>
                                ))}
                                <button
                                  onClick={() => setEditingDateId(null)}
                                  className="px-2 py-1 rounded-lg text-xs font-medium bg-void-50 text-zinc-400 hover:text-zinc-200 border border-violet-900/20"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setEditingDateId(session.id!)}
                                className="text-xs text-rose-400 hover:text-rose-300 font-medium"
                              >
                                {new Date(session.date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                                <span className="text-zinc-600 ml-1">(tap to change)</span>
                              </button>
                            )}
                          </div>

                          {session.exercises.length > 0 && (
                            <div>
                              <div className="text-[10px] text-zinc-500 mb-1.5 font-medium uppercase tracking-wider">Exercises</div>
                              <div className="flex flex-wrap gap-1">
                                {session.exercises.map((ex, i) => (
                                  <span
                                    key={i}
                                    className="bg-void-50 px-2 py-1 rounded-lg text-xs text-zinc-300 border border-violet-900/10"
                                  >
                                    {ex.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {session.warmup && (
                            <div>
                              <div className="text-[10px] text-zinc-500 mb-1.5 font-medium uppercase tracking-wider">Warmup</div>
                              <div className="bg-rose-950/20 border border-rose-900/20 rounded-xl p-2.5 text-xs leading-relaxed text-zinc-300">
                                {session.warmup.split('\n').map((line, i) => (
                                  <p key={i} className={line.trim() ? 'mb-0.5' : ''}>
                                    {line}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                          {session.cooldown && (
                            <div>
                              <div className="text-[10px] text-zinc-500 mb-1.5 font-medium uppercase tracking-wider">Cooldown</div>
                              <div className="bg-accent-950/20 border border-accent-900/20 rounded-xl p-2.5 text-xs leading-relaxed text-zinc-300">
                                {session.cooldown.split('\n').map((line, i) => (
                                  <p key={i} className={line.trim() ? 'mb-0.5' : ''}>
                                    {line}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                          {session.notes && (
                            <div>
                              <div className="text-[10px] text-zinc-500 mb-1.5 font-medium uppercase tracking-wider">Notes</div>
                              <div className="text-xs text-zinc-300 whitespace-pre-wrap">{session.notes}</div>
                            </div>
                          )}
                          <button
                            onClick={() => handleDelete(session.id!)}
                            className="text-red-400 text-xs hover:text-red-300 font-medium flex items-center gap-1 pt-1"
                          >
                            <Trash2 size={12} />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
