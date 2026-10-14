import { describe, it, expect } from 'vitest'
import { expectedCorrect, updateRatings } from './elo'

describe('elo', () => {
  it('cân bằng khi rating bằng nhau', () => {
    expect(expectedCorrect(1000, 1000)).toBeCloseTo(0.5, 5)
  })

  it('đúng câu khó thì tăng nhiều hơn câu dễ', () => {
    const base = {
      userRating: 1000,
      correct: true,
      userAttempts: 10,
      questionAttempts: 100,
      guess: 0,
      inContest: false,
    }
    const hard = updateRatings({ ...base, questionRating: 1400 })
    const easy = updateRatings({ ...base, questionRating: 800 })
    expect(hard.newUserRating - 1000).toBeGreaterThan(easy.newUserRating - 1000)
  })

  it('sai thì rating giảm', () => {
    const r = updateRatings({
      userRating: 1000,
      questionRating: 1000,
      correct: false,
      userAttempts: 10,
      questionAttempts: 100,
      guess: 0,
      inContest: false,
    })
    expect(r.newUserRating).toBeLessThan(1000)
  })
})

