export const DIFFICULTY_BASE: Record<number, number> = { 1: 800, 2: 1000, 3: 1200, 4: 1400 }
export const GUESS_FLOOR_MCQ = 0.25
export const DEFAULT_USER_RATING = 1000

export function expectedCorrect(userRating: number, questionRating: number, guess = 0): number {
  const p = 1 / (1 + Math.pow(10, (questionRating - userRating) / 400))
  return guess + (1 - guess) * p
}

export function kFactorUser(attempts: number, inContest: boolean): number {
  const base = attempts < 30 ? 40 : attempts < 100 ? 24 : 16
  return inContest ? base * 1.5 : base
}

export function kFactorQuestion(attempts: number): number {
  return attempts < 50 ? 16 : 6
}

export interface EloInput {
  userRating: number
  questionRating: number
  correct: boolean
  userAttempts: number
  questionAttempts: number
  guess: number          // 0.25 cho mcq, 0 cho short
  inContest: boolean
}

export interface EloResult {
  expected: number
  newUserRating: number
  newQuestionRating: number
}

export function updateRatings(i: EloInput): EloResult {
  const expected = expectedCorrect(i.userRating, i.questionRating, i.guess)
  const score = i.correct ? 1 : 0

  const newUser = i.userRating + kFactorUser(i.userAttempts, i.inContest) * (score - expected)
  const newQ = i.questionRating - kFactorQuestion(i.questionAttempts) * (score - expected)

  return {
    expected,
    newUserRating: Math.max(100, Math.round(newUser)),
    newQuestionRating: Math.min(2400, Math.max(400, Math.round(newQ * 10) / 10)),
  }
}

