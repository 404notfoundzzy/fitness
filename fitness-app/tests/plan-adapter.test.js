import { describe, it, expect } from 'vitest'
import {
  adaptPlanDetail,
  adaptPlanListItem,
  adaptPlanForApi,
  adaptExerciseForApi,
  adaptDayForApi,
  parseTags,
  FIELD_MAP,
} from '@/utils/planAdapter.js'

describe('planAdapter - parseTags', () => {
  it('parses JSON array string', () => {
    expect(parseTags('["push","strength"]')).toEqual(['push', 'strength'])
  })

  it('parses comma-separated string', () => {
    expect(parseTags('push,strength,upper')).toEqual(['push', 'strength', 'upper'])
  })

  it('returns array as-is', () => {
    expect(parseTags(['a', 'b'])).toEqual(['a', 'b'])
  })

  it('returns empty for null/undefined', () => {
    expect(parseTags(null)).toEqual([])
    expect(parseTags(undefined)).toEqual([])
  })

  it('handles JSON parse failure gracefully', () => {
    expect(parseTags('not-json{')).toEqual(['not-json{'])
  })

  it('filters empty strings from comma split', () => {
    expect(parseTags('a,,b,')).toEqual(['a', 'b'])
  })
})

describe('planAdapter - adaptPlanDetail', () => {
  const apiPlan = {
    id: 7,
    name: '上肢推力强化计划',
    type: 'three-split',
    description: 'Upper body push plan',
    daysPerWeek: 3,
    difficulty: 'intermediate',
    targetAudience: 'Intermediate lifters',
    tags: 'push,strength,upper',
    planType: 0,
    source: 'user',
  }

  const apiDays = [
    {
      dayNumber: 1,
      dayName: '胸部与三角',
      focus: '胸部、三角肌',
      exercises: [
        { exerciseId: 139, exerciseName: '帕洛夫推压', sets: 3, reps: '12-15', restSeconds: 45, notes: 'Core anti-rotation', sortOrder: 1 },
        { exerciseId: null, exerciseName: '空杆仰卧推', sets: 4, reps: '8-12', restSeconds: 90, notes: '', sortOrder: 2 },
      ],
    },
    {
      dayNumber: 2,
      dayName: '背部与二头',
      focus: '背部、二头肌',
      exercises: [
        { exerciseId: 30, exerciseName: '引体向上', sets: 4, reps: '6-8', restSeconds: 120, notes: '', sortOrder: 1 },
      ],
    },
  ]

  it('maps API plan + days to frontend format', () => {
    const result = adaptPlanDetail(apiPlan, apiDays)

    expect(result.id).toBe(7)
    expect(result.name).toBe('上肢推力强化计划')
    expect(result.type).toBe('three-split')
    expect(result.daysPerWeek).toBe(3)
    expect(result.difficulty).toBe('intermediate')
    expect(result.tags).toEqual(['push', 'strength', 'upper'])
    expect(result.planType).toBe(0)
    expect(result.source).toBe('user')
  })

  it('converts days to schedule format', () => {
    const result = adaptPlanDetail(apiPlan, apiDays)

    expect(result.schedule).toHaveLength(2)
    expect(result.schedule[0]).toEqual({
      day: 1,
      name: '胸部与三角',
      focus: '胸部、三角肌',
      exercises: [
        { id: 139, name: '帕洛夫推压', sets: 3, reps: '12-15', restSeconds: 45, notes: 'Core anti-rotation', sortOrder: 1 },
        { id: null, name: '空杆仰卧推', sets: 4, reps: '8-12', restSeconds: 90, notes: '', sortOrder: 2 },
      ],
    })
  })

  it('handles missing fields with defaults', () => {
    const result = adaptPlanDetail({}, [])

    expect(result.id).toBeUndefined()
    expect(result.name).toBe('')
    expect(result.type).toBe('custom')
    expect(result.difficulty).toBe('intermediate')
    expect(result.tags).toEqual([])
    expect(result.schedule).toEqual([])
  })

  it('handles null days', () => {
    const result = adaptPlanDetail(apiPlan, null)
    expect(result.schedule).toEqual([])
  })
})

describe('planAdapter - adaptPlanListItem', () => {
  it('maps API list item without schedule', () => {
    const item = { id: 1, name: 'Test', type: 'five-split', planType: 1, source: 'system', tags: '["a","b"]' }
    const result = adaptPlanListItem(item)

    expect(result.id).toBe(1)
    expect(result.name).toBe('Test')
    expect(result.tags).toEqual(['a', 'b'])
    expect(result.schedule).toBeUndefined()
  })
})

describe('planAdapter - adaptPlanForApi', () => {
  it('converts local plan to API format', () => {
    const localPlan = {
      name: 'My Plan',
      type: 'custom',
      description: 'desc',
      daysPerWeek: 3,
      difficulty: 'beginner',
      targetAudience: 'novice',
      tags: ['push', 'pull'],
      planType: 0,
      schedule: [
        {
          day: 1,
          name: 'Push Day',
          focus: 'Chest',
          exercises: [
            { id: 10, name: 'Bench Press', sets: 4, reps: '8-12', restSeconds: 90, notes: '' },
          ],
        },
      ],
    }

    const result = adaptPlanForApi(localPlan)

    expect(result.name).toBe('My Plan')
    expect(result.tags).toBe('push,pull')
    expect(result.planType).toBe(0)
    expect(result.days).toHaveLength(1)
    expect(result.days[0].dayNumber).toBe(1)
    expect(result.days[0].dayName).toBe('Push Day')
    expect(result.days[0].sortOrder).toBe(1)
    expect(result.days[0].exercises[0].exerciseName).toBe('Bench Press')
    expect(result.days[0].exercises[0].exerciseId).toBe(10)
    expect(result.days[0].exercises[0].sortOrder).toBe(1)
  })
})

describe('planAdapter - FIELD_MAP consistency', () => {
  it('exercise map has all required keys', () => {
    const keys = Object.keys(FIELD_MAP.exercise)
    expect(keys).toContain('id')
    expect(keys).toContain('name')
    expect(keys).toContain('sets')
    expect(keys).toContain('reps')
    expect(keys).toContain('restSeconds')
    expect(keys).toContain('notes')
  })

  it('day map has all required keys', () => {
    const keys = Object.keys(FIELD_MAP.day)
    expect(keys).toContain('dayNumber')
    expect(keys).toContain('dayName')
    expect(keys).toContain('focus')
  })

  it('plan map has all required keys', () => {
    const keys = Object.keys(FIELD_MAP.plan)
    expect(keys).toContain('id')
    expect(keys).toContain('name')
    expect(keys).toContain('type')
    expect(keys).toContain('daysPerWeek')
    expect(keys).toContain('difficulty')
    expect(keys).toContain('tags')
    expect(keys).toContain('planType')
  })
})

describe('planAdapter - round-trip', () => {
  it('adaptPlanForApi(adaptPlanDetail(...)) preserves key fields', () => {
    const apiPlan = {
      id: 7,
      name: 'Test Plan',
      type: 'three-split',
      description: 'desc',
      daysPerWeek: 3,
      difficulty: 'intermediate',
      targetAudience: 'athletes',
      tags: 'a,b',
      planType: 0,
      source: 'user',
    }
    const apiDays = [
      {
        dayNumber: 1,
        dayName: 'Day1',
        focus: 'Chest',
        exercises: [
          { exerciseId: 1, exerciseName: 'Push', sets: 3, reps: '10', restSeconds: 60, notes: 'go', sortOrder: 1 },
        ],
      },
    ]

    const adapted = adaptPlanDetail(apiPlan, apiDays)
    const backToApi = adaptPlanForApi(adapted)

    expect(backToApi.name).toBe('Test Plan')
    expect(backToApi.type).toBe('three-split')
    expect(backToApi.daysPerWeek).toBe(3)
    expect(backToApi.difficulty).toBe('intermediate')
    expect(backToApi.days[0].dayNumber).toBe(1)
    expect(backToApi.days[0].dayName).toBe('Day1')
    expect(backToApi.days[0].exercises[0].exerciseName).toBe('Push')
    expect(backToApi.days[0].exercises[0].exerciseId).toBe(1)
  })
})
