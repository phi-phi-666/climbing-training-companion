import { useLiveQuery } from 'dexie-react-hooks'
import { v4 as uuidv4 } from 'uuid'
import { db, type DailyNutrition, type Meal } from '../services/db'
import { calculateMealPoints } from '../services/nutrition'

function getTodayDateStr(): string {
  return new Date().toISOString().split('T')[0]
}

export function useTodayNutrition() {
  const todayStr = getTodayDateStr()

  const nutrition = useLiveQuery(
    () => db.dailyNutrition.where('date').equals(todayStr).first(),
    [todayStr]
  )

  return nutrition ?? null
}

export function useNutritionByDate(date: string) {
  const nutrition = useLiveQuery(
    () => db.dailyNutrition.where('date').equals(date).first(),
    [date]
  )

  return nutrition ?? null
}

export function useRecentNutrition(days: number = 7) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)
  const cutoffDateStr = cutoffDate.toISOString().split('T')[0]

  const nutrition = useLiveQuery(
    () =>
      db.dailyNutrition
        .where('date')
        .aboveOrEqual(cutoffDateStr)
        .reverse()
        .sortBy('date'),
    [cutoffDateStr]
  )

  return nutrition ?? []
}

export async function addMeal(
  mealData: Omit<Meal, 'id' | 'timestamp'>
): Promise<void> {
  const todayStr = getTodayDateStr()
  const meal: Meal = {
    ...mealData,
    id: uuidv4(),
    timestamp: Date.now()
  }

  const existingDay = await db.dailyNutrition
    .where('date')
    .equals(todayStr)
    .first()

  const points = calculateMealPoints(meal)

  if (existingDay) {
    const updatedMeals = [...existingDay.meals, meal]
    const newProteinTotal = existingDay.proteinTotal + meal.proteinGrams
    const newVeganPoints = existingDay.veganPoints + points

    await db.dailyNutrition.update(existingDay.id!, {
      meals: updatedMeals,
      proteinTotal: newProteinTotal,
      veganPoints: newVeganPoints
    })
  } else {
    await db.dailyNutrition.add({
      date: todayStr,
      meals: [meal],
      proteinTotal: meal.proteinGrams,
      veganPoints: points
    })
  }
}

export async function deleteMeal(mealId: string): Promise<void> {
  const todayStr = getTodayDateStr()
  const existingDay = await db.dailyNutrition
    .where('date')
    .equals(todayStr)
    .first()

  if (!existingDay) return

  const mealToRemove = existingDay.meals.find((m) => m.id === mealId)
  if (!mealToRemove) return

  const updatedMeals = existingDay.meals.filter((m) => m.id !== mealId)
  const pointsToRemove = calculateMealPoints(mealToRemove)

  await db.dailyNutrition.update(existingDay.id!, {
    meals: updatedMeals,
    proteinTotal: existingDay.proteinTotal - mealToRemove.proteinGrams,
    veganPoints: existingDay.veganPoints - pointsToRemove
  })
}

export async function updateMeal(
  mealId: string,
  updates: Partial<Omit<Meal, 'id' | 'timestamp'>>
): Promise<void> {
  const todayStr = getTodayDateStr()
  const existingDay = await db.dailyNutrition
    .where('date')
    .equals(todayStr)
    .first()

  if (!existingDay) return

  const mealIndex = existingDay.meals.findIndex((m) => m.id === mealId)
  if (mealIndex === -1) return

  const oldMeal = existingDay.meals[mealIndex]
  const oldPoints = calculateMealPoints(oldMeal)

  const updatedMeal: Meal = { ...oldMeal, ...updates }
  const newPoints = calculateMealPoints(updatedMeal)

  const updatedMeals = [...existingDay.meals]
  updatedMeals[mealIndex] = updatedMeal

  const proteinDiff = updatedMeal.proteinGrams - oldMeal.proteinGrams
  const pointsDiff = newPoints - oldPoints

  await db.dailyNutrition.update(existingDay.id!, {
    meals: updatedMeals,
    proteinTotal: existingDay.proteinTotal + proteinDiff,
    veganPoints: existingDay.veganPoints + pointsDiff
  })
}

export type { DailyNutrition, Meal }
