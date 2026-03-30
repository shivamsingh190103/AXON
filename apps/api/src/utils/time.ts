export function nowPlus(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d
}

export function isFirstDayOfMonth(date = new Date()) {
  return date.getDate() === 1
}
