import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Session, type Exercise } from '../services/db'

export function useSessionHistory(days: number = 7) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)
  const cutoffDateStr = cutoffDate.toISOString().split('T')[0]

  const sessions = useLiveQuery(
    () =>
      db.sessions
        .where('date')
        .aboveOrEqual(cutoffDateStr)
        .reverse()
        .sortBy('date'),
    [cutoffDateStr]
  )

  return sessions ?? []
}

export function useRecentSessions(limit: number = 10) {
  const sessions = useLiveQuery(() =>
    db.sessions.orderBy('createdAt').reverse().limit(limit).toArray()
  )

  return sessions ?? []
}

export function useLastSessionByType(type: Session['type']) {
  const session = useLiveQuery(
    () =>
      db.sessions
        .where('type')
        .equals(type)
        .toArray()
        .then((sessions) => {
          if (sessions.length === 0) return null
          // Sort by date descending, then by createdAt descending to get the most recent
          sessions.sort((a, b) => {
            const dateCompare = b.date.localeCompare(a.date)
            if (dateCompare !== 0) return dateCompare
            return b.createdAt - a.createdAt
          })
          return sessions[0]
        }),
    [type]
  )

  return session
}

export function useDaysSinceLastSession(type: Session['type']): number | null {
  const lastSession = useLastSessionByType(type)

  if (lastSession === undefined) return null
  if (lastSession === null) return null

  const lastDate = new Date(lastSession.date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  lastDate.setHours(0, 0, 0, 0)

  const diffTime = today.getTime() - lastDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

export async function addSession(
  session: Omit<Session, 'id' | 'createdAt'>
): Promise<number> {
  const id = await db.sessions.add({
    ...session,
    createdAt: Date.now()
  })
  return id as number
}

export async function updateSession(
  id: number,
  updates: Partial<Omit<Session, 'id' | 'createdAt'>>
): Promise<number> {
  return db.sessions.update(id, updates)
}

export async function deleteSession(id: number): Promise<void> {
  return db.sessions.delete(id)
}

export async function getSessionById(id: number): Promise<Session | undefined> {
  return db.sessions.get(id)
}

export function useHasSessionToday(): boolean {
  const todayStr = new Date().toISOString().split('T')[0]

  const sessions = useLiveQuery(
    () => db.sessions.where('date').equals(todayStr).toArray(),
    [todayStr]
  )

  return (sessions?.length ?? 0) > 0
}

// Get the most recent climbing session (boulder or lead) for 24h hangboard rule
export function useLastClimbingSession(): Session | null {
  const session = useLiveQuery(
    () =>
      db.sessions
        .toArray()
        .then((sessions) => {
          // Filter to climbing sessions only
          const climbingSessions = sessions.filter(
            s => s.type === 'boulder' || s.type === 'lead'
          )
          if (climbingSessions.length === 0) return null
          // Sort by date descending, then by createdAt descending
          climbingSessions.sort((a, b) => {
            const dateCompare = b.date.localeCompare(a.date)
            if (dateCompare !== 0) return dateCompare
            return b.createdAt - a.createdAt
          })
          return climbingSessions[0]
        }),
    []
  )

  return session ?? null
}

export type { Session, Exercise }
