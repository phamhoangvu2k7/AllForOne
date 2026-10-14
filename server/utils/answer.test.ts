import { describe, it, expect } from 'vitest'
import { normalizeAnswer, checkAnswer } from './answer'

describe('answer evaluation', () => {
  it('correctly matches mcq answers', () => {
    expect(checkAnswer('mcq', 'A', ['A'])).toBe(true)
    expect(checkAnswer('mcq', 'B', ['A'])).toBe(false)
  })

  it('correctly normalizes short answers with comma and spaces', () => {
    expect(normalizeAnswer(' 3,14 ')).toBe('3.14')
    expect(checkAnswer('short', '3,14', ['3.14'])).toBe(true)
    expect(checkAnswer('short', '3.1400', ['3.14'])).toBe(true)
    expect(checkAnswer('short', '-2,5', ['-2.5'])).toBe(true)
  })
})

