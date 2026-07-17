import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFrom = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({ from: mockFrom }),
}))

import { selectWeeklyQuestions } from '../questions'

describe('selectWeeklyQuestions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns at most `count` questions', async () => {
    const fakeQuestions = [
      { id: '1', text: 'Q1', theme: 'funny', source: 'manual', times_used: 0, last_used_at: null },
      { id: '2', text: 'Q2', theme: 'milestone', source: 'manual', times_used: 0, last_used_at: null },
      { id: '3', text: 'Q3', theme: 'feelings', source: 'manual', times_used: 0, last_used_at: null },
      { id: '4', text: 'Q4', theme: 'routines', source: 'manual', times_used: 0, last_used_at: null },
    ]
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: fakeQuestions }),
    })

    const result = await selectWeeklyQuestions(3)
    expect(result.length).toBeLessThanOrEqual(3)
  })

  it('avoids selecting two questions with the same theme when possible', async () => {
    const fakeQuestions = [
      { id: '1', text: 'Q1', theme: 'funny', source: 'manual', times_used: 0, last_used_at: null },
      { id: '2', text: 'Q2', theme: 'funny', source: 'manual', times_used: 0, last_used_at: null },
      { id: '3', text: 'Q3', theme: 'milestone', source: 'manual', times_used: 0, last_used_at: null },
    ]
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: fakeQuestions }),
    })

    const result = await selectWeeklyQuestions(3)
    const themes = result.map(q => q.theme)
    const funnyCount = themes.filter(t => t === 'funny').length
    expect(funnyCount).toBeLessThanOrEqual(1)
  })
})
