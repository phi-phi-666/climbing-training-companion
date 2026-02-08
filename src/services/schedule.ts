// Training schedule configuration
// Stores user's climbing schedule and location-based workout preferences

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6 // Sunday = 0, Monday = 1, etc.

export type ClimbingType = 'boulder' | 'lead'

export type Location = 'home' | 'gym' | 'outdoor'

export interface ClimbingDay {
  dayOfWeek: DayOfWeek
  type: ClimbingType
  // For days with variable type (like Saturday: 80% lead, 20% boulder)
  alternateType?: ClimbingType
  alternateProbability?: number // 0-1, e.g., 0.2 for 20%
}

export interface ScheduleConfig {
  climbingDays: ClimbingDay[]
  homeEquipment: string[]
  // Weekly overrides - dates when schedule differs from normal
  overrides: {
    date: string // ISO date string
    skipClimbing?: boolean
    forceClimbing?: ClimbingType
  }[]
}

// Default schedule: Monday boulder, Wednesday boulder, Saturday lead (80%) / boulder (20%)
const DEFAULT_SCHEDULE: ScheduleConfig = {
  climbingDays: [
    { dayOfWeek: 1, type: 'boulder' }, // Monday
    { dayOfWeek: 3, type: 'boulder' }, // Wednesday
    { dayOfWeek: 6, type: 'lead', alternateType: 'boulder', alternateProbability: 0.2 } // Saturday
  ],
  homeEquipment: [
    'mat',
    'dumbbells',
    'resistance bands',
    'hangboard',
    'ab wheel'
  ],
  overrides: []
}

const SCHEDULE_STORAGE_KEY = 'alpha_schedule_config'

export function getScheduleConfig(): ScheduleConfig {
  try {
    const stored = localStorage.getItem(SCHEDULE_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Clean up old overrides (more than 7 days ago)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const weekAgoStr = weekAgo.toISOString().split('T')[0]
      parsed.overrides = (parsed.overrides || []).filter(
        (o: { date: string }) => o.date >= weekAgoStr
      )
      return { ...DEFAULT_SCHEDULE, ...parsed }
    }
  } catch {
    // Ignore parsing errors
  }
  return DEFAULT_SCHEDULE
}

export function saveScheduleConfig(config: ScheduleConfig): void {
  localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(config))
}

export function addScheduleOverride(
  date: string,
  override: { skipClimbing?: boolean; forceClimbing?: ClimbingType }
): void {
  const config = getScheduleConfig()
  // Remove existing override for this date
  config.overrides = config.overrides.filter(o => o.date !== date)
  // Add new override
  config.overrides.push({ date, ...override })
  saveScheduleConfig(config)
}

export function removeScheduleOverride(date: string): void {
  const config = getScheduleConfig()
  config.overrides = config.overrides.filter(o => o.date !== date)
  saveScheduleConfig(config)
}

export function isClimbingDay(date: Date = new Date()): boolean {
  const config = getScheduleConfig()
  const dateStr = date.toISOString().split('T')[0]

  // Check for overrides first
  const override = config.overrides.find(o => o.date === dateStr)
  if (override) {
    if (override.skipClimbing) return false
    if (override.forceClimbing) return true
  }

  // Check regular schedule
  const dayOfWeek = date.getDay() as DayOfWeek
  return config.climbingDays.some(d => d.dayOfWeek === dayOfWeek)
}

export function getClimbingTypeForDay(date: Date = new Date()): ClimbingType | null {
  const config = getScheduleConfig()
  const dateStr = date.toISOString().split('T')[0]

  // Check for overrides first
  const override = config.overrides.find(o => o.date === dateStr)
  if (override) {
    if (override.skipClimbing) return null
    if (override.forceClimbing) return override.forceClimbing
  }

  // Check regular schedule
  const dayOfWeek = date.getDay() as DayOfWeek
  const climbingDay = config.climbingDays.find(d => d.dayOfWeek === dayOfWeek)

  if (!climbingDay) return null

  // Handle variable type days (like Saturday)
  if (climbingDay.alternateType && climbingDay.alternateProbability) {
    // Use date as seed for consistent daily result
    const seed = parseInt(dateStr.replace(/-/g, ''))
    const pseudoRandom = (seed * 9301 + 49297) % 233280 / 233280
    if (pseudoRandom < climbingDay.alternateProbability) {
      return climbingDay.alternateType
    }
  }

  return climbingDay.type
}

export function getDayName(dayOfWeek: DayOfWeek): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[dayOfWeek]
}

// Session types allowed per location
export const SESSION_TYPES_BY_LOCATION: Record<Location, string[]> = {
  home: ['hiit', 'mobility', 'core', 'hangboard'],
  gym: ['gym', 'hiit', 'crossfit', 'cardio', 'mobility'],
  outdoor: ['cardio', 'mobility']
}

// Check if hangboard is allowed (24h rule after climbing)
export function canDoHangboard(lastClimbingDate: Date | null): boolean {
  if (!lastClimbingDate) return true

  const now = new Date()
  const hoursSinceClimbing = (now.getTime() - lastClimbingDate.getTime()) / (1000 * 60 * 60)

  return hoursSinceClimbing >= 24
}

export function getHomeEquipment(): string[] {
  return getScheduleConfig().homeEquipment
}
