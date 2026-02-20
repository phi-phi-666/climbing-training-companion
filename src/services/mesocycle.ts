import { db, type Mesocycle } from './db'

export async function createMesocycle(
  mesocycle: Omit<Mesocycle, 'id' | 'createdAt'>
): Promise<number> {
  // Deactivate any existing active mesocycle
  const active = await db.mesocycles.where('status').equals('active').first()
  if (active && active.id) {
    await db.mesocycles.update(active.id, { status: 'paused' })
  }

  const id = await db.mesocycles.add({
    ...mesocycle,
    createdAt: Date.now()
  })
  return id as number
}

export async function updateMesocycle(
  id: number,
  updates: Partial<Omit<Mesocycle, 'id' | 'createdAt'>>
): Promise<number> {
  return db.mesocycles.update(id, updates)
}

export async function getActiveMesocycle(): Promise<Mesocycle | undefined> {
  return db.mesocycles.where('status').equals('active').first()
}

export async function advanceMesocycleWeek(id: number): Promise<void> {
  const mesocycle = await db.mesocycles.get(id)
  if (!mesocycle) return

  const nextWeek = mesocycle.currentWeek + 1
  if (nextWeek > mesocycle.weeks) {
    await db.mesocycles.update(id, { status: 'completed' })
  } else {
    await db.mesocycles.update(id, { currentWeek: nextWeek })
  }
}

export async function completeMesocycle(id: number): Promise<void> {
  await db.mesocycles.update(id, { status: 'completed' })
}

export async function pauseMesocycle(id: number): Promise<void> {
  await db.mesocycles.update(id, { status: 'paused' })
}

export async function resumeMesocycle(id: number): Promise<void> {
  // Pause any other active mesocycle first
  const active = await db.mesocycles.where('status').equals('active').first()
  if (active && active.id && active.id !== id) {
    await db.mesocycles.update(active.id, { status: 'paused' })
  }
  await db.mesocycles.update(id, { status: 'active' })
}

export async function deleteMesocycle(id: number): Promise<void> {
  await db.mesocycles.delete(id)
}
