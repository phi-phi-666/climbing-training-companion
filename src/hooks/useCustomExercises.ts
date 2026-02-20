import { useLiveQuery } from 'dexie-react-hooks'
import { db, type CustomExercise } from '../services/db'

export function useCustomExercises() {
  const exercises = useLiveQuery(
    () => db.customExercises.orderBy('createdAt').reverse().toArray()
  )
  return exercises ?? []
}

export async function addCustomExercise(
  exercise: Omit<CustomExercise, 'id' | 'createdAt'>
): Promise<number> {
  const id = await db.customExercises.add({
    ...exercise,
    createdAt: Date.now()
  })
  return id as number
}

export async function deleteCustomExercise(id: number): Promise<void> {
  return db.customExercises.delete(id)
}

export type { CustomExercise }
