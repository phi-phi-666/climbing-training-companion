import Dexie, { type EntityTable } from 'dexie'

export interface Exercise {
  name: string
  muscleGroup: string
  sets?: number
  reps?: number
  durationSeconds?: number
  supersetGroup?: number
  actualWeight?: number
  actualReps?: number[]
}

export interface Session {
  id?: number
  date: string
  type: 'boulder' | 'lead' | 'hangboard' | 'gym' | 'cardio' | 'hiit' | 'crossfit' | 'mobility'
  boulderSubType?: 'problems' | 'circuits' | 'campus' | 'intervals'
  cardioSubType?: 'bike' | 'elliptical' | 'run' | 'row'
  exercises: Exercise[]
  durationMinutes: number
  notes?: string
  warmup?: string
  cooldown?: string
  sessionRating?: number
  perceivedExertion?: number
  fatigueLevel?: number
  mesocycleId?: number
  mesocycleWeek?: number
  mesocycleDay?: number
  createdAt: number
}

export interface CustomExercise {
  id?: number
  name: string
  muscleGroup: string
  category: string
  description?: string
  namePl?: string
  createdAt: number
}

export interface MesocycleDay {
  sessionType: string
  focus?: string
  intensity?: string
  exercises?: { name: string; sets?: number; reps?: string }[]
  notes?: string
}

export interface MesocycleWeek {
  weekNumber: number
  theme: string
  intensity: number
  days: Record<string, MesocycleDay>
}

export interface Mesocycle {
  id?: number
  name: string
  goal: string
  weeks: number
  currentWeek: number
  startDate: string
  status: 'active' | 'paused' | 'completed'
  plan: MesocycleWeek[]
  createdAt: number
}

const db = new Dexie('ClimbingTrainingDB') as Dexie & {
  sessions: EntityTable<Session, 'id'>
  customExercises: EntityTable<CustomExercise, 'id'>
  mesocycles: EntityTable<Mesocycle, 'id'>
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

// Version 4: Add rating/RPE fields, custom exercises, mesocycles
db.version(4).stores({
  sessions: '++id, date, type, createdAt, mesocycleId',
  customExercises: '++id, name, muscleGroup, category, createdAt',
  mesocycles: '++id, status, startDate, createdAt'
})

export { db }
