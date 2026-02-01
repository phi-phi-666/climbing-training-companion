import type { Meal } from './db'
import type { Session } from './db'

export function calculateMealPoints(meal: Meal): number {
  let points = 0

  // Base points for logging
  points += 1

  // Vegan bonus
  if (meal.isVegan) points += 2

  // Protein thresholds
  if (meal.proteinGrams >= 30) points += 3
  else if (meal.proteinGrams >= 20) points += 2
  else if (meal.proteinGrams >= 10) points += 1

  // Vegan + high protein combo
  if (meal.isVegan && meal.proteinGrams >= 30) points += 2

  return points
}

export function calculateDailyProteinTarget(
  recentSessions: Session[],
  baseTarget: number = 120
): number {
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  const todaySessions = recentSessions.filter((s) => s.date === today)
  const yesterdaySessions = recentSessions.filter((s) => s.date === yesterday)

  let adjustment = 0

  // Today's activity adjustment
  for (const session of todaySessions) {
    switch (session.type) {
      case 'boulder':
      case 'lead':
        adjustment += 20
        break
      case 'hangboard':
        adjustment += 10
        break
      case 'supplementary':
        adjustment += 15
        break
    }
  }

  // Yesterday's high intensity recovery bonus
  const hadIntenseYesterday = yesterdaySessions.some(
    (s) => s.type === 'boulder' || s.type === 'lead'
  )
  if (hadIntenseYesterday) {
    adjustment += 10
  }

  return baseTarget + adjustment
}

export function getProteinProgress(current: number, target: number): {
  percentage: number
  status: 'low' | 'on-track' | 'achieved' | 'exceeded'
} {
  const percentage = Math.round((current / target) * 100)

  let status: 'low' | 'on-track' | 'achieved' | 'exceeded'
  if (percentage >= 110) {
    status = 'exceeded'
  } else if (percentage >= 100) {
    status = 'achieved'
  } else if (percentage >= 60) {
    status = 'on-track'
  } else {
    status = 'low'
  }

  return { percentage, status }
}
