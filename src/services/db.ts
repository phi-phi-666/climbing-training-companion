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
  type: 'boulder' | 'lead' | 'hangboard' | 'gym' | 'cardio' | 'hiit' | 'crossfit'
  boulderSubType?: 'problems' | 'circuits' | 'campus' | 'intervals'
  exercises: Exercise[]
  durationMinutes: number
  notes?: string
  warmup?: string
  cooldown?: string
  createdAt: number
}

const db = new Dexie('ClimbingTrainingDB') as Dexie & {
  sessions: EntityTable<Session, 'id'>
}

db.version(1).stores({
  sessions: '++id, date, type, createdAt',
  dailyNutrition: '++id, &date'
})

// Version 2: Remove dailyNutrition, add boulderSubType support
db.version(2).stores({
  sessions: '++id, date, type, createdAt',
  dailyNutrition: null // Delete the table
})

export { db }
