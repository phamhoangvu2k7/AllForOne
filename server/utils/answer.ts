export function normalizeAnswer(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, '').replace(',', '.')
}

export function checkAnswer(type: 'mcq' | 'short', answer: string, accepted: string[]): boolean {
  if (type === 'mcq') return accepted.includes(answer)
  const a = normalizeAnswer(answer)
  return accepted.some((x) => {
    const b = normalizeAnswer(x)
    if (a === b) return true
    const na = Number(a)
    const nb = Number(b)
    return Number.isFinite(na) && Number.isFinite(nb) && Math.abs(na - nb) < 1e-6
  })
}

