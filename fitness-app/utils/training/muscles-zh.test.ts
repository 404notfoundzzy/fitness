// 中文肌肉名规范化测试
// 用例取自健身小助手现有 exercise 表 muscle_group 的真实取值（sql/02-exercise-library-*.sql），
// 以及常见中文健身文本写法。
import { describe, it, expect } from 'vitest'
import { canonicalizeZhMuscle } from './muscles-zh'

describe('存量数据中的真实取值', () => {
  const cases: Array<[string, string]> = [
    ['胸大肌上部', 'chest'],
    ['胸大肌', 'chest'],
    ['背阔肌', 'upper-back'],
    ['腘绳肌-大腿后侧', 'hamstring'],
    ['三角肌前/中束', 'deltoids'],
    ['三角肌前束', 'deltoids'],
    ['三角肌后束', 'deltoids'],
    ['三角肌全束', 'deltoids'],
  ]
  for (const [input, expected] of cases) {
    it(`${input} → ${expected}`, () => {
      expect(canonicalizeZhMuscle(input)).toBe(expected)
    })
  }
})

describe('常见中文写法', () => {
  it('核心/腹直肌/腹斜肌各归其位', () => {
    expect(canonicalizeZhMuscle('核心')).toBe('abs')
    expect(canonicalizeZhMuscle('腹直肌')).toBe('abs')
    expect(canonicalizeZhMuscle('腹斜肌')).toBe('obliques')
    expect(canonicalizeZhMuscle('侧腹')).toBe('obliques')
  })

  it('具体先于笼统：腘绳先于大腿，股四先于腿部', () => {
    expect(canonicalizeZhMuscle('大腿后侧')).toBe('hamstring')
    expect(canonicalizeZhMuscle('大腿前侧')).toBe('quadriceps')
    expect(canonicalizeZhMuscle('大腿')).toBe('quadriceps')
    expect(canonicalizeZhMuscle('腿部')).toBe('quadriceps')
  })

  it('上背/下背不混淆', () => {
    expect(canonicalizeZhMuscle('上背部')).toBe('upper-back')
    expect(canonicalizeZhMuscle('下背部')).toBe('lower-back')
    expect(canonicalizeZhMuscle('竖脊肌')).toBe('lower-back')
  })

  it('英文与规范 slug 透传', () => {
    expect(canonicalizeZhMuscle('chest')).toBe('chest')
    expect(canonicalizeZhMuscle('lats')).toBe('upper-back')
    expect(canonicalizeZhMuscle('quadriceps')).toBe('quadriceps')
    expect(canonicalizeZhMuscle('Quads')).toBe('quadriceps')
  })

  it('不可识别与空值返回 null', () => {
    expect(canonicalizeZhMuscle('')).toBeNull()
    expect(canonicalizeZhMuscle(null)).toBeNull()
    expect(canonicalizeZhMuscle(undefined)).toBeNull()
    expect(canonicalizeZhMuscle('随便写的')).toBeNull()
  })

  it('带修饰的中文复合词取主肌肉', () => {
    expect(canonicalizeZhMuscle('胸大肌上部')).toBe('chest')
    expect(canonicalizeZhMuscle('臀部（臀大肌）')).toBe('gluteal')
    expect(canonicalizeZhMuscle('肩部三角肌')).toBe('deltoids')
  })
})
