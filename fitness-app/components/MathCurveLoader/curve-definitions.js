const curves = [
  {
    name: 'original-thinking',
    label: 'Original Thinking',
    tag: 'Custom Rose Trail',
    descriptionZh: '基础圆周叠加了 7 倍频余弦项，轨迹长成旋转中的七瓣花环。',
    rotate: true,
    particleCount: 64,
    trailSpan: 0.38,
    durationMs: 4600,
    rotationDurationMs: 28000,
    pulseDurationMs: 4200,
    strokeWidth: 5.5,
    config: { baseRadius: 7, detailAmplitude: 3, petalCount: 7, curveScale: 3.9 },
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2
      const petals = Math.round(config.petalCount)
      const x = config.baseRadius * Math.cos(t) - config.detailAmplitude * detailScale * Math.cos(petals * t)
      const y = config.baseRadius * Math.sin(t) - config.detailAmplitude * detailScale * Math.sin(petals * t)
      return { x: 50 + x * config.curveScale, y: 50 + y * config.curveScale }
    },
  },
  {
    name: 'thinking-five',
    label: 'Thinking Five',
    tag: 'Custom Rose Trail',
    descriptionZh: '5 倍频项替代 7 倍频，轨迹呈现更简洁的五瓣节奏。',
    rotate: true,
    particleCount: 62,
    trailSpan: 0.38,
    durationMs: 4600,
    rotationDurationMs: 28000,
    pulseDurationMs: 4200,
    strokeWidth: 5.5,
    config: { baseRadius: 7, detailAmplitude: 3, petalCount: 5, curveScale: 3.9 },
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2
      const petals = Math.round(config.petalCount)
      const x = config.baseRadius * Math.cos(t) - config.detailAmplitude * detailScale * Math.cos(petals * t)
      const y = config.baseRadius * Math.sin(t) - config.detailAmplitude * detailScale * Math.sin(petals * t)
      return { x: 50 + x * config.curveScale, y: 50 + y * config.curveScale }
    },
  },
  {
    name: 'thinking-nine',
    label: 'Thinking Nine',
    tag: 'Custom Rose Trail',
    descriptionZh: '9 倍频项把更多小回环压进同一圈轨道，花环更密更细。',
    rotate: true,
    particleCount: 68,
    trailSpan: 0.39,
    durationMs: 4700,
    rotationDurationMs: 30000,
    pulseDurationMs: 4200,
    strokeWidth: 5.5,
    config: { baseRadius: 7, detailAmplitude: 3, petalCount: 9, curveScale: 3.9 },
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2
      const petals = Math.round(config.petalCount)
      const x = config.baseRadius * Math.cos(t) - config.detailAmplitude * detailScale * Math.cos(petals * t)
      const y = config.baseRadius * Math.sin(t) - config.detailAmplitude * detailScale * Math.sin(petals * t)
      return { x: 50 + x * config.curveScale, y: 50 + y * config.curveScale }
    },
  },
  {
    name: 'rose-orbit',
    label: 'Rose Orbit',
    tag: 'r = cos(kθ)',
    descriptionZh: '半径随 cos(7t) 起伏，轨迹在圆周上反复鼓起花瓣。',
    rotate: true,
    particleCount: 72,
    trailSpan: 0.42,
    durationMs: 5200,
    rotationDurationMs: 28000,
    pulseDurationMs: 4600,
    strokeWidth: 5.2,
    config: { orbitRadius: 7, detailAmplitude: 2.7, petalCount: 7, curveScale: 3.9 },
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2
      const k = Math.round(config.petalCount)
      const r = config.orbitRadius - config.detailAmplitude * detailScale * Math.cos(k * t)
      return { x: 50 + Math.cos(t) * r * config.curveScale, y: 50 + Math.sin(t) * r * config.curveScale }
    },
  },
  {
    name: 'rose-curve',
    label: 'Rose Curve',
    tag: 'r = a cos(kθ)',
    descriptionZh: 'r = a cos(5t) 生成五个均匀花瓣，呼吸倍率让花瓣轻微胀缩。',
    rotate: true,
    particleCount: 78,
    trailSpan: 0.32,
    durationMs: 5400,
    rotationDurationMs: 28000,
    pulseDurationMs: 4600,
    strokeWidth: 4.5,
    config: { roseA: 9.2, roseABoost: 0.6, roseBreathBase: 0.72, roseBreathBoost: 0.28, roseK: 5, roseScale: 3.25 },
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2
      const a = config.roseA + detailScale * config.roseABoost
      const k = Math.round(config.roseK)
      const r = a * (config.roseBreathBase + detailScale * config.roseBreathBoost) * Math.cos(k * t)
      return { x: 50 + Math.cos(t) * r * config.roseScale, y: 50 + Math.sin(t) * r * config.roseScale }
    },
  },
  {
    name: 'rose-two',
    label: 'Rose Two',
    tag: 'r = a cos(2θ)',
    descriptionZh: 'k=2 时余弦半径生成宽阔对称花瓣，呼吸倍率让中心鼓动。',
    rotate: true,
    particleCount: 74,
    trailSpan: 0.3,
    durationMs: 5200,
    rotationDurationMs: 28000,
    pulseDurationMs: 4300,
    strokeWidth: 4.6,
    config: { roseA: 9.2, roseABoost: 0.6, roseBreathBase: 0.72, roseBreathBoost: 0.28, roseScale: 3.25 },
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2
      const a = config.roseA + detailScale * config.roseABoost
      const r = a * (config.roseBreathBase + detailScale * config.roseBreathBoost) * Math.cos(2 * t)
      return { x: 50 + Math.cos(t) * r * config.roseScale, y: 50 + Math.sin(t) * r * config.roseScale }
    },
  },
  {
    name: 'rose-three',
    label: 'Rose Three',
    tag: 'r = a cos(3θ)',
    descriptionZh: 'k=3 时曲线落成三瓣旋转结构，内层呼吸感避免静态感。',
    rotate: true,
    particleCount: 76,
    trailSpan: 0.31,
    durationMs: 5300,
    rotationDurationMs: 28000,
    pulseDurationMs: 4400,
    strokeWidth: 4.6,
    config: { roseA: 9.2, roseABoost: 0.6, roseBreathBase: 0.72, roseBreathBoost: 0.28, roseScale: 3.25 },
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2
      const a = config.roseA + detailScale * config.roseABoost
      const r = a * (config.roseBreathBase + detailScale * config.roseBreathBoost) * Math.cos(3 * t)
      return { x: 50 + Math.cos(t) * r * config.roseScale, y: 50 + Math.sin(t) * r * config.roseScale }
    },
  },
  {
    name: 'rose-four',
    label: 'Rose Four',
    tag: 'r = a cos(4θ)',
    descriptionZh: 'k=4 时花瓣呈十字形玫瑰，呼吸核心添加柔和脉冲。',
    rotate: true,
    particleCount: 74,
    trailSpan: 0.3,
    durationMs: 5200,
    rotationDurationMs: 28000,
    pulseDurationMs: 4300,
    strokeWidth: 4.6,
    config: { roseA: 9.2, roseABoost: 0.6, roseBreathBase: 0.72, roseBreathBoost: 0.28, roseScale: 3.25 },
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2
      const a = config.roseA + detailScale * config.roseABoost
      const r = a * (config.roseBreathBase + detailScale * config.roseBreathBoost) * Math.cos(4 * t)
      return { x: 50 + Math.cos(t) * r * config.roseScale, y: 50 + Math.sin(t) * r * config.roseScale }
    },
  },
  {
    name: 'lissajous-drift',
    label: 'Lissajous Drift',
    tag: 'x = sin(at), y = sin(bt)',
    descriptionZh: '不同频率的正弦函数让路径反复交叉，产生示波器般的编织感。',
    rotate: true,
    particleCount: 80,
    trailSpan: 0.34,
    durationMs: 5800,
    rotationDurationMs: 32000,
    pulseDurationMs: 4800,
    strokeWidth: 4.2,
    config: { lissA: 3, lissB: 4, lissDelta: 0.5, lissScale: 8.5 },
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2
      const x = Math.sin(config.lissA * t + config.lissDelta + detailScale * 0.3) * config.lissScale
      const y = Math.sin(config.lissB * t) * config.lissScale
      return { x: 50 + x, y: 50 + y }
    },
  },
  {
    name: 'lemniscate-bloom',
    label: 'Lemniscate Bloom',
    tag: 'Bernoulli Lemniscate',
    descriptionZh: '1 + sin²t 分母夹住中心同时保留两瓣，曲线像呼吸的无穷符号。',
    rotate: true,
    particleCount: 72,
    trailSpan: 0.36,
    durationMs: 5000,
    rotationDurationMs: 26000,
    pulseDurationMs: 4400,
    strokeWidth: 4.8,
    config: { lemScale: 28, lemBreathBase: 0.8, lemBreathBoost: 0.2 },
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2
      const s = config.lemBreathBase + detailScale * config.lemBreathBoost
      const denom = 1 + Math.sin(t) * Math.sin(t)
      const x = (config.lemScale * s * Math.cos(t)) / denom
      const y = (config.lemScale * s * Math.sin(t) * Math.cos(t)) / denom
      return { x: 50 + x, y: 50 + y }
    },
  },
  {
    name: 'hypotrochoid-loop',
    label: 'Hypotrochoid Loop',
    tag: 'Inner Spirograph',
    descriptionZh: '滚圆项创建嵌套转弯和偏移，路径像机器绘制的紧凑螺旋图。',
    rotate: true,
    particleCount: 82,
    trailSpan: 0.33,
    durationMs: 5600,
    rotationDurationMs: 30000,
    pulseDurationMs: 4600,
    strokeWidth: 4.3,
    config: { R: 5, r: 3, d: 5, hypoScale: 3.2 },
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2
      const s = 0.8 + detailScale * 0.2
      const x = ((config.R - config.r) * Math.cos(t) + config.d * s * Math.cos((config.R - config.r) / config.r * t)) * config.hypoScale
      const y = ((config.R - config.r) * Math.sin(t) - config.d * s * Math.sin((config.R - config.r) / config.r * t)) * config.hypoScale
      return { x: 50 + x, y: 50 + y }
    },
  },
  {
    name: 'three-petal-spiral',
    label: 'Three-Petal Spiral',
    tag: 'R=3, r=1, d=3',
    descriptionZh: '滚圆设置生成三个大环花瓣，像紧凑的螺旋花一起呼吸。',
    rotate: true,
    particleCount: 70,
    trailSpan: 0.35,
    durationMs: 5200,
    rotationDurationMs: 28000,
    pulseDurationMs: 4400,
    strokeWidth: 4.8,
    config: { R: 3, r: 1, d: 3, hypoScale: 6.5 },
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2
      const s = 0.8 + detailScale * 0.2
      const x = ((config.R - config.r) * Math.cos(t) + config.d * s * Math.cos((config.R - config.r) / config.r * t)) * config.hypoScale
      const y = ((config.R - config.r) * Math.sin(t) - config.d * s * Math.sin((config.R - config.r) / config.r * t)) * config.hypoScale
      return { x: 50 + x, y: 50 + y }
    },
  },
  {
    name: 'four-petal-spiral',
    label: 'Four-Petal Spiral',
    tag: 'R=4, r=1, d=3',
    descriptionZh: 'R=4 时滚圆路径落成四个环花瓣，旋转呼吸如一环。',
    rotate: true,
    particleCount: 72,
    trailSpan: 0.35,
    durationMs: 5400,
    rotationDurationMs: 28000,
    pulseDurationMs: 4400,
    strokeWidth: 4.6,
    config: { R: 4, r: 1, d: 3, hypoScale: 5.2 },
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2
      const s = 0.8 + detailScale * 0.2
      const x = ((config.R - config.r) * Math.cos(t) + config.d * s * Math.cos((config.R - config.r) / config.r * t)) * config.hypoScale
      const y = ((config.R - config.r) * Math.sin(t) - config.d * s * Math.sin((config.R - config.r) / config.r * t)) * config.hypoScale
      return { x: 50 + x, y: 50 + y }
    },
  },
  {
    name: 'five-petal-spiral',
    label: 'Five-Petal Spiral',
    tag: 'R=5, r=1, d=3',
    descriptionZh: 'R=5 时环数增至五瓣，螺旋花更密更华丽。',
    rotate: true,
    particleCount: 74,
    trailSpan: 0.35,
    durationMs: 5600,
    rotationDurationMs: 30000,
    pulseDurationMs: 4600,
    strokeWidth: 4.4,
    config: { R: 5, r: 1, d: 3, hypoScale: 4.2 },
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2
      const s = 0.8 + detailScale * 0.2
      const x = ((config.R - config.r) * Math.cos(t) + config.d * s * Math.cos((config.R - config.r) / config.r * t)) * config.hypoScale
      const y = ((config.R - config.r) * Math.sin(t) - config.d * s * Math.sin((config.R - config.r) / config.r * t)) * config.hypoScale
      return { x: 50 + x, y: 50 + y }
    },
  },
  {
    name: 'six-petal-spiral',
    label: 'Six-Petal Spiral',
    tag: 'R=6, r=1, d=3',
    descriptionZh: '滚圆路径分成六瓣，整环统一呼吸如原版加载器。',
    rotate: true,
    particleCount: 76,
    trailSpan: 0.35,
    durationMs: 5800,
    rotationDurationMs: 32000,
    pulseDurationMs: 4800,
    strokeWidth: 4.2,
    config: { R: 6, r: 1, d: 3, hypoScale: 3.5 },
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2
      const s = 0.8 + detailScale * 0.2
      const x = ((config.R - config.r) * Math.cos(t) + config.d * s * Math.cos((config.R - config.r) / config.r * t)) * config.hypoScale
      const y = ((config.R - config.r) * Math.sin(t) - config.d * s * Math.sin((config.R - config.r) / config.r * t)) * config.hypoScale
      return { x: 50 + x, y: 50 + y }
    },
  },
  {
    name: 'butterfly-phase',
    label: 'Butterfly Phase',
    tag: 'Butterfly Curve',
    descriptionZh: '指数和高频余弦项不对称地拉伸翅膀，路径呈蝴蝶振翅形状。',
    rotate: true,
    particleCount: 90,
    trailSpan: 0.28,
    durationMs: 6200,
    rotationDurationMs: 36000,
    pulseDurationMs: 5000,
    strokeWidth: 3.8,
    config: { bflyScale: 3.2 },
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 4
      const s = 0.85 + detailScale * 0.15
      const r = Math.exp(Math.sin(t)) - 2 * Math.cos(4 * t) + Math.pow(Math.sin((2 * t - Math.PI) / 24), 5)
      return { x: 50 + Math.cos(t) * r * config.bflyScale * s, y: 50 + Math.sin(t) * r * config.bflyScale * s }
    },
  },
  {
    name: 'cardioid-glow',
    label: 'Cardioid Glow',
    tag: 'Cardioid',
    descriptionZh: 'r = a(1 - cos t) 一侧收缩为零另一侧膨胀，曲线像柔和脉冲心波。',
    rotate: true,
    particleCount: 68,
    trailSpan: 0.38,
    durationMs: 4800,
    rotationDurationMs: 26000,
    pulseDurationMs: 4200,
    strokeWidth: 5.0,
    config: { cardioidA: 5.5, cardioidScale: 4.2 },
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2
      const s = 0.8 + detailScale * 0.2
      const r = config.cardioidA * (1 - Math.cos(t)) * s
      return { x: 50 + Math.cos(t) * r * config.cardioidScale, y: 50 + Math.sin(t) * r * config.cardioidScale }
    },
  },
  {
    name: 'cardioid-heart',
    label: 'Cardioid Heart',
    tag: 'r = a(1 + cosθ)',
    descriptionZh: '从 r = a(1 + cos t) 出发并旋转坐标，教科书心形线变成直立心形。',
    rotate: true,
    particleCount: 68,
    trailSpan: 0.38,
    durationMs: 4800,
    rotationDurationMs: 26000,
    pulseDurationMs: 4200,
    strokeWidth: 5.0,
    config: { cardioidA: 5.5, cardioidScale: 4.2 },
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2
      const s = 0.8 + detailScale * 0.2
      const r = config.cardioidA * (1 + Math.cos(t)) * s
      const angle = t - Math.PI / 2
      return { x: 50 + Math.cos(angle) * r * config.cardioidScale, y: 50 + Math.sin(angle) * r * config.cardioidScale }
    },
  },
  {
    name: 'heart-wave',
    label: 'Heart Wave',
    tag: 'f(x) Heart Wave',
    descriptionZh: 'x^(2/3) 包络提供心形轮廓，sin(bπx) 在内部填充可调水平波纹。',
    rotate: true,
    particleCount: 80,
    trailSpan: 0.34,
    durationMs: 5400,
    rotationDurationMs: 30000,
    pulseDurationMs: 4600,
    strokeWidth: 4.4,
    config: { heartScale: 5.5, heartB: 6 },
    point(progress, detailScale, config) {
      const t = (progress - 0.5) * 2
      const s = 0.85 + detailScale * 0.15
      const x = t * config.heartScale
      const envelope = Math.pow(Math.abs(t), 2 / 3)
      const wave = Math.sin(config.heartB * Math.PI * t) * 0.15 * s
      const y = -(envelope + wave) * config.heartScale * 1.2
      return { x: 50 + x, y: 50 + y }
    },
  },
  {
    name: 'spiral-search',
    label: 'Spiral Search',
    tag: 'Archimedean Spiral',
    descriptionZh: '快速增长的角配合余弦调制半径，螺旋向外展开后干净地收回。',
    rotate: true,
    particleCount: 86,
    trailSpan: 0.3,
    durationMs: 6000,
    rotationDurationMs: 34000,
    pulseDurationMs: 5000,
    strokeWidth: 4.0,
    config: { spiralGrowth: 2.8, spiralScale: 1.6, spiralTurns: 3 },
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2 * config.spiralTurns
      const s = 0.8 + detailScale * 0.2
      const r = config.spiralGrowth * t * s * (1 + 0.3 * Math.cos(t * 0.5))
      return { x: 50 + Math.cos(t) * r * config.spiralScale, y: 50 + Math.sin(t) * r * config.spiralScale }
    },
  },
  {
    name: 'fourier-flow',
    label: 'Fourier Flow',
    tag: 'Fourier Curve',
    descriptionZh: '多个正弦余弦分量互相干涉，形状像活着的波形不断变异。',
    rotate: true,
    particleCount: 88,
    trailSpan: 0.3,
    durationMs: 6200,
    rotationDurationMs: 34000,
    pulseDurationMs: 5000,
    strokeWidth: 4.0,
    config: { fourierScale: 6 },
    point(progress, detailScale, config) {
      const t = progress * Math.PI * 2
      const s = 0.85 + detailScale * 0.15
      const x = (Math.sin(t) + 0.5 * Math.sin(2 * t) + 0.3 * Math.cos(3 * t + s)) * config.fourierScale
      const y = (Math.cos(t) + 0.5 * Math.cos(2 * t) + 0.3 * Math.sin(3 * t + s)) * config.fourierScale
      return { x: 50 + x, y: 50 + y }
    },
  },
]

const curveMap = {}
curves.forEach(c => { curveMap[c.name] = c })

export { curves, curveMap }
export default curves
