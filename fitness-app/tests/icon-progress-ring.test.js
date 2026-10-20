import { describe, it, expect } from 'vitest'
import {
  getPlanIcon,
  getPlanColor,
  getPlanIconClass,
  PLAN_ICON_MAP,
  PLAN_COLOR_MAP,
  PLAN_ICON_CLASS_MAP,
} from '@/stores/training.js'

describe('训练计划图标映射常量', () => {
  describe('PLAN_ICON_MAP', () => {
    it('five-split 应映射为 flag-filled', () => {
      expect(PLAN_ICON_MAP['five-split']).toBe('flag-filled')
    })

    it('three-split 应映射为 loop', () => {
      expect(PLAN_ICON_MAP['three-split']).toBe('loop')
    })

    it('kai-three-split 应映射为 star-filled', () => {
      expect(PLAN_ICON_MAP['kai-three-split']).toBe('star-filled')
    })

    it('full-body 应映射为 staff-filled', () => {
      expect(PLAN_ICON_MAP['full-body']).toBe('staff-filled')
    })

    it('custom 应映射为 person（非 flag-filled）', () => {
      expect(PLAN_ICON_MAP['custom']).toBe('person')
      expect(PLAN_ICON_MAP['custom']).not.toBe('flag-filled')
    })

    it('应包含所有5种计划类型', () => {
      const keys = Object.keys(PLAN_ICON_MAP)
      expect(keys).toHaveLength(5)
      expect(keys).toContain('five-split')
      expect(keys).toContain('three-split')
      expect(keys).toContain('kai-three-split')
      expect(keys).toContain('full-body')
      expect(keys).toContain('custom')
    })
  })

  describe('PLAN_COLOR_MAP', () => {
    it('five-split 应使用红色系 #ef4444', () => {
      expect(PLAN_COLOR_MAP['five-split']).toBe('#ef4444')
    })

    it('three-split 应使用蓝色系 #3b82f6', () => {
      expect(PLAN_COLOR_MAP['three-split']).toBe('#3b82f6')
    })

    it('full-body 应使用绿色系 #10b981', () => {
      expect(PLAN_COLOR_MAP['full-body']).toBe('#10b981')
    })

    it('kai-three-split 应使用紫色系 #a78bfa', () => {
      expect(PLAN_COLOR_MAP['kai-three-split']).toBe('#a78bfa')
    })

    it('custom 应使用琥珀色 #f59e0b（非蓝色）', () => {
      expect(PLAN_COLOR_MAP['custom']).toBe('#f59e0b')
      expect(PLAN_COLOR_MAP['custom']).not.toBe('#2F6BFF')
    })

    it('所有颜色值应为有效的 hex 格式', () => {
      const hexPattern = /^#[0-9a-fA-F]{6}$/
      Object.entries(PLAN_COLOR_MAP).forEach(([type, color]) => {
        expect(hexPattern.test(color)).toBe(true)
      })
    })

    it('每种计划类型应有不同的颜色', () => {
      const colors = Object.values(PLAN_COLOR_MAP)
      const uniqueColors = new Set(colors)
      expect(uniqueColors.size).toBe(colors.length)
    })
  })

  describe('PLAN_ICON_CLASS_MAP', () => {
    it('five-split 应映射为 icon-red', () => {
      expect(PLAN_ICON_CLASS_MAP['five-split']).toBe('icon-red')
    })

    it('three-split 应映射为 icon-blue', () => {
      expect(PLAN_ICON_CLASS_MAP['three-split']).toBe('icon-blue')
    })

    it('kai-three-split 应映射为 icon-purple', () => {
      expect(PLAN_ICON_CLASS_MAP['kai-three-split']).toBe('icon-purple')
    })

    it('full-body 应映射为 icon-green', () => {
      expect(PLAN_ICON_CLASS_MAP['full-body']).toBe('icon-green')
    })

    it('custom 应映射为 icon-custom（非 icon-blue）', () => {
      expect(PLAN_ICON_CLASS_MAP['custom']).toBe('icon-custom')
      expect(PLAN_ICON_CLASS_MAP['custom']).not.toBe('icon-blue')
    })
  })
})

describe('getPlanIcon / getPlanColor / getPlanIconClass 导出函数', () => {
  describe('getPlanIcon', () => {
    it('已知类型应返回对应图标', () => {
      expect(getPlanIcon('five-split')).toBe('flag-filled')
      expect(getPlanIcon('custom')).toBe('person')
    })

    it('未知类型应返回默认值 flag-filled', () => {
      expect(getPlanIcon('unknown')).toBe('flag-filled')
      expect(getPlanIcon('')).toBe('flag-filled')
    })
  })

  describe('getPlanColor', () => {
    it('已知类型应返回对应颜色', () => {
      expect(getPlanColor('five-split')).toBe('#ef4444')
      expect(getPlanColor('custom')).toBe('#f59e0b')
    })

    it('未知类型应返回默认值 #2F6BFF', () => {
      expect(getPlanColor('unknown')).toBe('#2F6BFF')
    })
  })

  describe('getPlanIconClass', () => {
    it('已知类型应返回对应图标类名', () => {
      expect(getPlanIconClass('five-split')).toBe('icon-red')
      expect(getPlanIconClass('custom')).toBe('icon-custom')
    })

    it('未知类型应返回默认值 icon-blue', () => {
      expect(getPlanIconClass('unknown')).toBe('icon-blue')
    })
  })
})

describe('COLOR_PAIRS 与 PLAN_ICON_CLASS_MAP 一致性', () => {
  const COLOR_PAIRS = {
    'icon-red':    ['#ef4444', '#dc2626'],
    'icon-blue':   ['#3b82f6', '#2563eb'],
    'icon-purple': ['#a78bfa', '#7c3aed'],
    'icon-green':  ['#10b981', '#059669'],
    'icon-custom': ['#f59e0b', '#d97706'],
  }

  it('COLOR_PAIRS 应包含 PLAN_ICON_CLASS_MAP 中所有类名', () => {
    const classValues = new Set(Object.values(PLAN_ICON_CLASS_MAP))
    classValues.forEach((cls) => {
      expect(COLOR_PAIRS[cls]).toBeDefined()
    })
  })

  it('每个 COLOR_PAIRS 的主色应与 PLAN_COLOR_MAP 对应', () => {
    Object.entries(PLAN_ICON_CLASS_MAP).forEach(([type, cls]) => {
      const pair = COLOR_PAIRS[cls]
      const primaryColor = PLAN_COLOR_MAP[type]
      expect(pair[0]).toBe(primaryColor)
    })
  })

  it('每个 COLOR_PAIRS 应包含2个颜色值（主色 + 深色）', () => {
    Object.entries(COLOR_PAIRS).forEach(([, colors]) => {
      expect(colors.length).toBe(2)
    })
  })

  it('每个 COLOR_PAIRS 的深色应比主色更深', () => {
    Object.entries(COLOR_PAIRS).forEach(([, [primary, darker]]) => {
      const p = parseInt(primary.slice(1), 16)
      const d = parseInt(darker.slice(1), 16)
      expect(d).toBeLessThan(p)
    })
  })
})

describe('图标与系统推荐页一致性', () => {
  it('PLAN_ICON_CLASS_MAP 的类名应与 training-plan-list.vue 的 CSS 类名一致', () => {
    const expectedClasses = ['icon-red', 'icon-blue', 'icon-purple', 'icon-green', 'icon-custom']
    const actualClasses = Object.values(PLAN_ICON_CLASS_MAP)
    expectedClasses.forEach((cls) => {
      expect(actualClasses).toContain(cls)
    })
  })

  it('custom 类型应使用 person 图标（与系统推荐页自定义计划一致）', () => {
    expect(PLAN_ICON_MAP['custom']).toBe('person')
  })

  it('custom 类型应使用 icon-custom 类（与系统推荐页一致）', () => {
    expect(PLAN_ICON_CLASS_MAP['custom']).toBe('icon-custom')
  })
})
