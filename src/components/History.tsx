import { useSessionHistory, deleteSession, type Session } from '../hooks/useSessionHistory'
import { sessionTypes } from '../data/exercises'
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

  return (
    <div className="space-y-6">
      <header className="py-4">
        <h1 className="text-2xl font-bold">History</h1>
        <p className="text-gray-400 text-sm">Last 30 days</p>
      </header>

      {sessions.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-gray-400">No sessions recorded yet</p>
          <p className="text-gray-500 text-sm mt-2">Start logging your training!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedSessions).map(([date, daySessions]) => (
            <div key={date} className="card">
              <h2 className="text-sm font-semibold text-gray-400 mb-3">
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
                      className="bg-gray-700 rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : session.id!)}
                        className="w-full p-3 flex items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{typeInfo?.emoji}</span>
                          <div>
                            <div className="font-medium">{typeInfo?.label}</div>
                            <div className="text-sm text-gray-400">
                              {session.durationMinutes} min
                              {session.exercises.length > 0 && (
                                <span> · {session.exercises.length} exercises</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className="text-gray-400">{isExpanded ? '▲' : '▼'}</span>
                      </button>

                      {isExpanded && (
                        <div className="px-3 pb-3 border-t border-gray-600 pt-3">
                          {session.exercises.length > 0 && (
                            <div className="mb-3">
                              <div className="text-xs text-gray-400 mb-2">Exercises:</div>
                              <div className="flex flex-wrap gap-1">
                                {session.exercises.map((ex, i) => (
                                  <span
                                    key={i}
                                    className="bg-gray-600 px-2 py-1 rounded text-xs"
                                  >
                                    {ex.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {session.warmup && (
                            <div className="mb-3">
                              <div className="text-xs text-gray-400 mb-1">Warmup:</div>
                              <div className="bg-gray-600 rounded p-2 text-sm leading-relaxed">
                                {session.warmup.split('\n').map((line, i) => (
                                  <p key={i} className={line.trim() ? 'mb-1' : ''}>
                                    {line}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                          {session.cooldown && (
                            <div className="mb-3">
                              <div className="text-xs text-gray-400 mb-1">Cooldown:</div>
                              <div className="bg-teal-900/30 rounded p-2 text-sm leading-relaxed">
                                {session.cooldown.split('\n').map((line, i) => (
                                  <p key={i} className={line.trim() ? 'mb-1' : ''}>
                                    {line}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                          {session.notes && (
                            <div className="mb-3">
                              <div className="text-xs text-gray-400 mb-1">Notes:</div>
                              <p className="text-sm">{session.notes}</p>
                            </div>
                          )}
                          <button
                            onClick={() => handleDelete(session.id!)}
                            className="text-red-400 text-sm hover:text-red-300"
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
