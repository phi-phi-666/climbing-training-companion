import { useSessionHistory, deleteSession, type Session } from '../hooks/useSessionHistory'
import { sessionTypes, boulderSubTypes } from '../data/exercises'
import { useState } from 'react'

export default function History() {
  const sessions = useSessionHistory(30)
  const [expandedId, setExpandedId] = useState<number | null>(null)

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
    }
  }

  const getSessionLabel = (session: Session) => {
    const typeInfo = sessionTypes.find((t) => t.value === session.type)
    if (session.type === 'boulder' && session.boulderSubType) {
      const subType = boulderSubTypes.find(t => t.value === session.boulderSubType)
      return `${typeInfo?.label} - ${subType?.label}`
    }
    return typeInfo?.label || session.type
  }

  return (
    <div className="space-y-6">
      <header className="py-4">
        <h1 className="text-2xl font-bold">History</h1>
        <p className="text-stone-500 text-sm">Last 30 days</p>
      </header>

      {sessions.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-stone-400">No sessions recorded yet</p>
          <p className="text-stone-500 text-sm mt-2">Start logging your training!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedSessions).map(([date, daySessions]) => (
            <div key={date} className="card">
              <h2 className="text-sm font-semibold text-stone-500 mb-3">
                {new Date(date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}
              </h2>
              <div className="space-y-2">
                {daySessions.map((session) => {
                  const typeInfo = sessionTypes.find((t) => t.value === session.type)
                  const isExpanded = expandedId === session.id

                  return (
                    <div
                      key={session.id}
                      className="bg-stone-800 rounded-xl overflow-hidden border border-stone-700"
                    >
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : session.id!)}
                        className="w-full p-4 flex items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{typeInfo?.emoji}</span>
                          <div>
                            <div className="font-medium">{getSessionLabel(session)}</div>
                            <div className="text-sm text-stone-500">
                              {session.durationMinutes} min
                              {session.exercises.length > 0 && (
                                <span> · {session.exercises.length} exercises</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className="text-stone-500">{isExpanded ? '▲' : '▼'}</span>
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-stone-700 pt-4">
                          {session.exercises.length > 0 && (
                            <div className="mb-4">
                              <div className="text-xs text-stone-500 mb-2 font-medium">Exercises</div>
                              <div className="flex flex-wrap gap-1">
                                {session.exercises.map((ex, i) => (
                                  <span
                                    key={i}
                                    className="bg-stone-700 px-2 py-1 rounded-lg text-xs"
                                  >
                                    {ex.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {session.warmup && (
                            <div className="mb-4">
                              <div className="text-xs text-stone-500 mb-2 font-medium">Warmup</div>
                              <div className="bg-rose-950/30 border border-rose-900/30 rounded-xl p-3 text-sm leading-relaxed text-stone-300">
                                {session.warmup.split('\n').map((line, i) => (
                                  <p key={i} className={line.trim() ? 'mb-1' : ''}>
                                    {line}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                          {session.cooldown && (
                            <div className="mb-4">
                              <div className="text-xs text-stone-500 mb-2 font-medium">Cooldown</div>
                              <div className="bg-accent-950/30 border border-accent-900/30 rounded-xl p-3 text-sm leading-relaxed text-stone-300">
                                {session.cooldown.split('\n').map((line, i) => (
                                  <p key={i} className={line.trim() ? 'mb-1' : ''}>
                                    {line}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                          {session.notes && (
                            <div className="mb-4">
                              <div className="text-xs text-stone-500 mb-2 font-medium">Notes</div>
                              <p className="text-sm text-stone-300">{session.notes}</p>
                            </div>
                          )}
                          <button
                            onClick={() => handleDelete(session.id!)}
                            className="text-red-400 text-sm hover:text-red-300 font-medium"
                          >
                            Delete session
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
