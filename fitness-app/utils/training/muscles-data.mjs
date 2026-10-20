// 肌肉数据与名称规范化 —— 单一数据源
//
// 数据提取自 openGym（AGPL-3.0）muscles.js（commit e348fc1）的 MUSCLES / ALIAS /
// BY_BODYPART / SECONDARY，叠加健身小助手存量数据的中文规则。
// 同时被 App 模块（muscles.ts / muscles-zh.ts）与一次性导入脚本
// （scripts/opengym-exercise-import.mjs）引用，避免两处规则漂移。
// 权威算法实现在 muscles.ts；本文件只放数据与无依赖的纯函数。

// ── 肌肉定义（上游 muscles.js） ─────────────────────────────────────────────

/** 人体图可着色的肌肉，头到脚顺序 */
export const MUSCLES = [
  'trapezius', 'deltoids', 'chest', 'upper-back', 'serratus',
  'biceps', 'triceps', 'forearm',
  'abs', 'obliques', 'lower-back',
  'gluteal', 'quadriceps', 'hamstring', 'adductors', 'hip-flexors',
  'calves', 'tibialis',
]

/** 只画轮廓、永不着色：不承载训练负荷 */
export const INERT = ['head', 'hair', 'neck', 'hands', 'feet', 'knees', 'ankles']

/** 中文显示名 */
export const MUSCLE_NAME = {
  trapezius: '斜方肌', deltoids: '三角肌', chest: '胸大肌', 'upper-back': '上背部',
  serratus: '前锯肌', biceps: '肱二头肌', triceps: '肱三头肌', forearm: '前臂',
  abs: '腹直肌', obliques: '腹斜肌', 'lower-back': '下背部', gluteal: '臀大肌',
  quadriceps: '股四头肌', hamstring: '腘绳肌', adductors: '内收肌',
  'hip-flexors': '髋屈肌', calves: '小腿肌', tibialis: '胫骨前肌',
  'cardiovascular system': '心血管',
}

/** 上游英文名保留备查 */
export const MUSCLE_NAME_EN = {
  trapezius: 'Traps', deltoids: 'Shoulders', chest: 'Chest', 'upper-back': 'Upper back',
  serratus: 'Serratus', biceps: 'Biceps', triceps: 'Triceps', forearm: 'Forearms',
  abs: 'Abs', obliques: 'Obliques', 'lower-back': 'Lower back', gluteal: 'Glutes',
  quadriceps: 'Quads', hamstring: 'Hamstrings', adductors: 'Adductors',
  'hip-flexors': 'Hip flexors', calves: 'Calves', tibialis: 'Shins',
  'cardiovascular system': 'cardiovascular system',
}

/** 动作库 tg/sm 字段中出现过的每种拼写。null = 不可绘制 */
export const ALIAS = {
  // 主肌肉
  abs: 'abs', pectorals: 'chest', biceps: 'biceps', glutes: 'gluteal', delts: 'deltoids',
  triceps: 'triceps', 'upper back': 'upper-back', lats: 'upper-back', calves: 'calves',
  quads: 'quadriceps', forearms: 'forearm', hamstrings: 'hamstring', spine: 'lower-back',
  traps: 'trapezius', adductors: 'adductors', 'serratus anterior': 'serratus',
  abductors: 'gluteal', 'levator scapulae': 'trapezius', 'cardiovascular system': 'cardiovascular system',
  // 次要肌肉
  shoulders: 'deltoids', deltoids: 'deltoids', 'rear deltoids': 'deltoids',
  'rotator cuff': 'deltoids', quadriceps: 'quadriceps', core: 'abs', abdominals: 'abs',
  'lower abs': 'abs', chest: 'chest', 'upper chest': 'chest', 'hip flexors': 'hip-flexors',
  obliques: 'obliques', 'lower back': 'lower-back', rhomboids: 'upper-back',
  trapezius: 'trapezius', back: 'upper-back', 'latissimus dorsi': 'upper-back',
  brachialis: 'biceps', soleus: 'calves', shins: 'tibialis', wrists: 'forearm',
  'wrist flexors': 'forearm', 'wrist extensors': 'forearm', 'grip muscles': 'forearm',
  groin: 'adductors', 'inner thighs': 'adductors',
  ankles: null, feet: null, hands: null, 'ankle stabilizers': null,
  sternocleidomastoid: null,
}

/** 自定义动作只有身体部位，回退到它。组内权重和为 1 */
export const BY_BODYPART = {
  chest: { chest: 1 },
  back: { 'upper-back': 0.75, 'lower-back': 0.25 },
  shoulders: { deltoids: 1 },
  'upper arms': { biceps: 0.5, triceps: 0.5 },
  'lower arms': { forearm: 1 },
  waist: { abs: 0.7, obliques: 0.3 },
  'upper legs': { quadriceps: 0.4, hamstring: 0.35, gluteal: 0.25 },
  'lower legs': { calves: 0.8, tibialis: 0.2 },
  neck: { trapezius: 1 },
  'full body': { chest: 0.2, 'upper-back': 0.2, gluteal: 0.2, quadriceps: 0.2, hamstring: 0.1, abs: 0.1 },
  cardio: {},
}

/** 次要肌肉对主肌肉的计成比例 */
export const SECONDARY = 0.4

// ── 中文规则（健身小助手存量数据） ───────────────────────────────────────────

/** 有序规则：先匹配到的赢，具体模式必须排在笼统模式之前 */
export const ZH_MUSCLE_RULES = [
  [/腘绳|大腿后|后侧腱|腿后腱/, 'hamstring'],
  [/股四|大腿前|前侧股/, 'quadriceps'],
  [/臀/, 'gluteal'],
  // 下背必须先于"背部"匹配，否则"下背部"会被上背规则吃掉
  [/下背|腰背|竖脊|腰椎/, 'lower-back'],
  [/背阔|阔肌|上背|背部|菱形/, 'upper-back'],
  [/斜方/, 'trapezius'],
  [/三角|肩/, 'deltoids'],
  [/前锯|锯肌/, 'serratus'],
  [/胸/, 'chest'],
  [/肱二|二头|肱肌/, 'biceps'],
  [/肱三|三头/, 'triceps'],
  [/前臂|小臂|腕|肱桡/, 'forearm'],
  [/腹斜|侧腹|人鱼/, 'obliques'],
  [/腹|核心|腰腹/, 'abs'],
  [/髂腰|髋屈/, 'hip-flexors'],
  [/内收|大腿内/, 'adductors'],
  [/小腿|腓肠|比目鱼/, 'calves'],
  [/胫骨|前胫|小腿前/, 'tibialis'],
  [/心血管|心肺|有氧/, 'cardiovascular system'],
]

/** 兜底规则：更笼统的部位词 */
export const ZH_MUSCLE_FALLBACK = [
  [/大腿|腿部|下肢/, 'quadriceps'],
  [/手臂|上肢/, 'biceps'],
]

/** 器械识别（中英文混合），顺序即优先级 */
export const EQUIPMENT_RULES = [
  [/哑铃|dumbbell/i, 'dumbbell'],
  [/杠铃|barbell/i, 'barbell'],
  [/壶铃|kettlebell/i, 'kettlebell'],
  [/绳索|cable/i, 'cable'],
  [/smith/i, 'smith machine'],
  [/ez\s*bar|ez杠|曲杆/i, 'ez bar'],
  [/trap\s*bar|六角杠/i, 'trap bar'],
  [/machine|器械/i, 'machine'],
  [/lever|杠杆/i, 'lever machine'],
  [/弹力带|band/i, 'band'],
  [/自重|body\s*weight|bodyweight/i, 'body weight'],
  [/绳索机|rope/i, 'rope'],
  [/雪橇|sled/i, 'sled'],
  [/landmine|地雷架/i, 'landmine'],
  [/悬挂|trx|rings|吊环/i, 'suspension trainer'],
  [/瑜伽球|swiss\s*ball|exercise\s*ball|medicine\s*ball/i, 'ball'],
]

/** 器械未命中时的默认值 */
export const EQUIPMENT_DEFAULT = 'other'

/**
 * 从自由文本识别器械。
 * @param {Array<string|null|undefined>} texts 按优先级排列的文本（如上游 eq 字段 + 动作名）
 */
export const equipmentOf = (...texts) => {
  const s = texts.filter(Boolean).join(' ').toLowerCase()
  for (const [re, eq] of EQUIPMENT_RULES) if (re.test(s)) return eq
  return EQUIPMENT_DEFAULT
}

// ── 名称规范化 ──────────────────────────────────────────────────────────────

const MUSCLE_SET = new Set(MUSCLES)

/** 任意英文拼写 → 规范 slug；不可绘制或未知名返回 null */
export function canonicalMuscleFrom(value) {
  const name = String(value ?? '').toLowerCase().trim()
  if (!name) return null
  if (MUSCLE_SET.has(name)) return name
  return ALIAS[name] ?? null
}

/** 复合文本分隔符：斜杠、顿号、逗号、加号、连字符、空白、"和/与" */
const SEGMENT_RE = /[\/、,，+＋]|\s+|\s*[-–—]\s*|和|与/

function matchRules(raw) {
  if (!raw) return null
  const direct = canonicalMuscleFrom(raw)
  if (direct) return direct
  for (const [re, slug] of ZH_MUSCLE_RULES) if (re.test(raw)) return slug
  for (const [re, slug] of ZH_MUSCLE_FALLBACK) if (re.test(raw)) return slug
  return null
}

/**
 * 中文肌肉文本 → 规范 slug；无法识别返回 null。
 * 英文/已规范的输入直接透传；复合文本（"臀大肌/腘绳肌"）按书写顺序取
 * 第一个可识别段——中文习惯主肌肉写在前面。
 */
export function canonicalizeZhMuscle(text) {
  if (text == null) return null
  const raw = String(text).trim()
  if (!raw) return null
  const direct = canonicalMuscleFrom(raw)
  if (direct) return direct
  if (SEGMENT_RE.test(raw)) {
    for (const seg of raw.split(SEGMENT_RE)) {
      const hit = matchRules(seg.trim())
      if (hit) return hit
    }
  }
  return matchRules(raw)
}
