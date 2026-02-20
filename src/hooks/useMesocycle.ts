import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Mesocycle } from '../services/db'

export function useActiveMesocycle(): Mesocycle | null {
  const mesocycle = useLiveQuery(
    () => db.mesocycles.where('status').equals('active').first(),
    []
  )
  return mesocycle ?? null
}

export function useAllMesocycles(): Mesocycle[] {
  const mesocycles = useLiveQuery(
    () => db.mesocycles.orderBy('createdAt').reverse().toArray(),
    []
  )
  return mesocycles ?? []
}
