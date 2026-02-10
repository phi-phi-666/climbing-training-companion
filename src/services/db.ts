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
  type: 'boulder' | 'lead' | 'hangboard' | 'gym' | 'cardio' | 'hiit' | 'crossfit' | 'mobility' | 'core'
  boulderSubType?: 'problems' | 'circuits' | 'campus' | 'intervals'
  cardioSubType?: 'bike' | 'elliptical' | 'run' | 'row'
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

// Version 3: Add cardioSubType and mobility session type
db.version(3).stores({
  sessions: '++id, date, type, createdAt'
})

export { db }
