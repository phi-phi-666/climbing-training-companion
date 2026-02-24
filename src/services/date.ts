/** Format a Date as YYYY-MM-DD in local timezone. Avoids the UTC off-by-one
 *  bug that happens with toISOString().split('T')[0] near midnight. */
export function localDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayStr(): string {
  return localDateStr(new Date())
}
