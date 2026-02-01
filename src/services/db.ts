import Dexie, { type EntityTable } from 'dexie'

export interface Exercise {
  name: string
  muscleGroup: string
  sets?: number
  reps?: number
  durationSeconds?: number
}

export interface Session {
  id?: number
  date: string
  type: 'boulder' | 'lead' | 'hangboard' | 'supplementary'
  exercises: Exercise[]
  durationMinutes: number
  notes?: string
  warmup?: string
  cooldown?: string
  createdAt: number
}

export interface Meal {
  id: string
  description: string
  proteinGrams: number
  isVegan: boolean
  timestamp: number
}

export interface DailyNutrition {
  id?: number
  date: string
  meals: Meal[]
  proteinTotal: number
  veganPoints: number
}

const db = new Dexie('ClimbingTrainingDB') as Dexie & {
  sessions: EntityTable<Session, 'id'>
  dailyNutrition: EntityTable<DailyNutrition, 'id'>
}

db.version(1).stores({
  sessions: '++id, date, type, createdAt',
  dailyNutrition: '++id, &date'
})

export { db }
