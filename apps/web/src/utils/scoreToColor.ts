export function scoreToColor(score: number) {
  if (score >= 70) return '#34D399'
  if (score >= 40) return '#FB923C'
  return '#F87171'
}
