#!/usr/bin/env node
// openGym 动作库导入脚本（一次性迁移工具）
//
// 输入：
//   integrations/openGym/frontend/src/lib/exercises-data.js   上游动作库（AGPL-3.0，commit e348fc1）
//   sql/02-exercise-library-*.sql                              健身小助手现有预置动作
// 输出：
//   sql/07-opengym-exercise-schema.sql     表结构扩展 DDL
//   sql/08-opengym-exercise-backfill.sql   存量 63 条动作的结构化字段回填
//   sql/09-opengym-exercise-data.sql       上游动作批量导入（临时表 + 去重插入）
//   integrations/opengym-exercises.json    清洗后的动作数据集（无媒体字段，供 App/API 使用）
//
// 合规：仅移植文本与结构数据；上游 img/gif 媒体素材 © gymvisual.com 仅授权 openGym 使用，
// 本脚本一律不输出媒体字段。
//
// 用法：node fitness-app/scripts/opengym-exercise-import.mjs

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ZH_MUSCLE_RULES, ZH_MUSCLE_FALLBACK, equipmentOf, canonicalizeZhMuscle } from '../utils/training/muscles-data.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// scripts/ 位于 <repo>/fitness-app/scripts/，上溯两级即仓库根
const REPO_ROOT = path.resolve(__dirname, '../..')
const UPSTREAM_DATA = path.join(REPO_ROOT, 'integrations/openGym/frontend/src/lib/exercises-data.js')
const EXISTING_SQLS = [
  path.join(REPO_ROOT, 'sql/02-exercise-library-init.sql'),
  path.join(REPO_ROOT, 'sql/02-exercise-library-supplement.sql'),
]
const OUT_SCHEMA = path.join(REPO_ROOT, 'sql/07-opengym-exercise-schema.sql')
const OUT_BACKFILL = path.join(REPO_ROOT, 'sql/08-opengym-exercise-backfill.sql')
const OUT_DATA = path.join(REPO_ROOT, 'sql/09-opengym-exercise-data.sql')
const OUT_JSON = path.join(REPO_ROOT, 'integrations/opengym-exercises.json')

// ── SQL 工具 ────────────────────────────────────────────────────────────────

const sqlStr = v => (v == null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`)
const sqlJson = arr => sqlStr(JSON.stringify(arr))

/** 按顶层逗号切分 SQL 值元组，尊重单引号字符串（'' 转义） */
function splitTuple(inner) {
  const out = []
  let cur = ''
  let inStr = false
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i]
    if (inStr) {
      if (ch === "'") {
        if (inner[i + 1] === "'") { cur += "''"; i++ }
        else { inStr = false; cur += ch }
      } else cur += ch
    } else if (ch === "'") { inStr = true; cur += ch }
    else if (ch === ',') { out.push(cur.trim()); cur = '' }
    else cur += ch
  }
  if (cur.trim() !== '') out.push(cur.trim())
  return out
}

/** 去掉 SQL 字符串字面量的外层引号并反转义 */
const unquote = v => (v.startsWith("'") && v.endsWith("'") ? v.slice(1, -1).replace(/''/g, "'") : v)

// ── 解析上游 EXDB ───────────────────────────────────────────────────────────

function parseUpstream() {
  const src = fs.readFileSync(UPSTREAM_DATA, 'utf8')
  const marker = 'export const EXDB='
  const start = src.indexOf(marker)
  if (start < 0) throw new Error('未找到 EXDB 定义')
  const arrStart = start + marker.length
  // 数组以 ] 后跟换行/分号/文件尾结束（上游文件为 CRLF 且无分号）
  const endMatch = src.slice(arrStart).match(/\](?=\r?\n|;|$)/)
  if (!endMatch) throw new Error('未找到 EXDB 数组结尾')
  const arrEnd = arrStart + endMatch.index
  const db = JSON.parse(src.slice(arrStart, arrEnd + 1))
  if (!Array.isArray(db) || db.length < 1000) throw new Error(`EXDB 解析异常：${db?.length} 条`)
  // 只保留文本与结构字段，媒体字段（img/gif）不进入任何输出
  return db.map(e => ({
    id: e.id,
    name: e.n,
    bodyPart: e.bp ?? null,
    equipmentRaw: e.eq ?? null,
    primaryRaw: e.tg ?? null,
    secondaryRaw: e.mg ?? null,
    secondariesRaw: Array.isArray(e.sm) ? e.sm : [],
    categoryEn: e.cat ?? null,
  }))
}

// ── 解析现有 SQL 中的 exercise 行 ───────────────────────────────────────────

/** 从 pos 处（'(' 位置）读取一个括号配平的元组，返回 [内容, 下一位置] */
function readTuple(s, pos) {
  if (s[pos] !== '(') return null
  let depth = 0
  let inStr = false
  for (let i = pos; i < s.length; i++) {
    const ch = s[i]
    if (inStr) {
      if (ch === "'") {
        if (s[i + 1] === "'") i++
        else inStr = false
      }
    } else if (ch === "'") inStr = true
    else if (ch === '(') depth++
    else if (ch === ')') {
      depth--
      if (depth === 0) return [s.slice(pos + 1, i), i + 1]
    }
  }
  return null
}

/** 跳过空白与 SQL 行注释（-- 到行尾），返回下一个有效字符位置 */
function skipWsAndComments(s, pos) {
  for (;;) {
    while (pos < s.length && /\s/.test(s[pos])) pos++
    if (s[pos] === '-' && s[pos + 1] === '-') {
      const nl = s.indexOf('\n', pos)
      if (nl < 0) return s.length
      pos = nl + 1
      continue
    }
    return pos
  }
}

function parseExisting() {
  const rows = []
  const insertRe = /INSERT\s+(?:IGNORE\s+|LOW_PRIORITY\s+|DELAYED\s+)*INTO\s+exercise\s*\([^)]*\)\s*VALUES/gi
  for (const file of EXISTING_SQLS) {
    const src = fs.readFileSync(file, 'utf8')
    let m
    while ((m = insertRe.exec(src)) !== null) {
      let pos = m.index + m[0].length
      // 连续读取元组，直到语句结束（';' 或非逗号分隔）；跳过行间注释
      for (;;) {
        pos = skipWsAndComments(src, pos)
        const t = readTuple(src, pos)
        if (!t) break
        const fields = splitTuple(t[0]).map(unquote)
        if (fields.length >= 9) {
          rows.push({
            name: fields[0],
            nameEn: fields[1],
            category: fields[2],
            categoryType: fields[3],
            muscleGroup: fields[4],
            difficulty: fields[5],
            description: fields[6],
            professionalTips: fields[7],
            isSystem: fields[8],
            source: file,
          })
        }
        pos = skipWsAndComments(src, t[1])
        if (src[pos] === ',') { pos++; continue }
        break // ';' 或其他：语句结束
      }
    }
  }
  return rows
}

// ── 规范化 ─────────────────────────────────────────────────────────────────

/** 主肌肉 slug → 身体部位（上游 bp 缺失时的回退） */
const PRIMARY_TO_BODYPART = {
  chest: 'chest', serratus: 'chest',
  'upper-back': 'back', 'lower-back': 'back',
  trapezius: 'neck', deltoids: 'shoulders',
  biceps: 'upper arms', triceps: 'upper arms', forearm: 'lower arms',
  abs: 'waist', obliques: 'waist',
  gluteal: 'upper legs', quadriceps: 'upper legs', hamstring: 'upper legs',
  adductors: 'upper legs', 'hip-flexors': 'upper legs',
  calves: 'lower legs', tibialis: 'lower legs',
  'cardiovascular system': 'cardio',
}

const slugToZh = {
  trapezius: '斜方肌', deltoids: '三角肌', chest: '胸大肌', 'upper-back': '上背部',
  serratus: '前锯肌', biceps: '肱二头肌', triceps: '肱三头肌', forearm: '前臂',
  abs: '腹直肌', obliques: '腹斜肌', 'lower-back': '下背部', gluteal: '臀大肌',
  quadriceps: '股四头肌', hamstring: '腘绳肌', adductors: '内收肌',
  'hip-flexors': '髋屈肌', calves: '小腿肌', tibialis: '胫骨前肌',
  'cardiovascular system': '心血管',
}

// 肌肉/器械规范化统一来自共享数据源 muscles-data.mjs（与 App 侧同一份规则）
const canonicalOrNull = canonicalizeZhMuscle

// ── 主流程 ─────────────────────────────────────────────────────────────────

const upstream = parseUpstream()
const existingAll = parseExisting()
// 补充 SQL 与初始化 SQL 有重复条目（INSERT IGNORE 语义），按 name_en 去重保留首条
const existing = [...new Map(existingAll.map(r => [(r.nameEn || '').toLowerCase(), r])).values()]
console.log(`上游动作：${upstream.length} 条；现有预置：${existing.length} 条（去重前 ${existingAll.length}）`)

const byNameEn = new Map()
for (const e of upstream) {
  const key = e.name.toLowerCase()
  if (!byNameEn.has(key)) byNameEn.set(key, e)
}

// 上游命名是器械前缀式（"barbell incline bench press"），而存量 name_en 多为
// "Incline Barbell Bench Press" 词序。生成变体：设备词提前 / 移除设备词。
const EQUIP_WORD = /^(barbell|dumbbell|dumbbells|cable|machine|smith|kettlebell|band|bands|ez|trap|lever|bodyweight|body weight|weighted|assisted)$/i
const nameVariants = nameEn => {
  const s = (nameEn || '').trim()
  const out = new Set([s.toLowerCase()])
  const words = s.split(/\s+/).filter(Boolean)
  const eqIdx = words.findIndex(w => EQUIP_WORD.test(w))
  if (eqIdx >= 0) {
    const eq = words[eqIdx]
    const rest = words.filter((_, i) => i !== eqIdx)
    out.add([eq, ...rest].join(' ').toLowerCase())
    out.add(rest.join(' ').toLowerCase())
  }
  return [...out].filter(Boolean)
}

// 第三级匹配：去设备词 + 词序无关 + 粗复数归一 的词集合键。
// "Romanian Deadlift" → {deadlift, romanian}；上游 "barbell romanian deadlift" 同键。
// 仅对两个及以上实词的键生效，避免 "press" 这类泛指撞车。
const normWord = w => w.toLowerCase().replace(/[^a-z0-9]/g, '')
const wordKey = nameEn => {
  const words = (nameEn || '').split(/\s+/).filter(Boolean).map(normWord)
    .filter(w => w && !EQUIP_WORD.test(w))
    .map(w => (w.endsWith('s') && !w.endsWith('ss') && w.length > 3 ? w.slice(0, -1) : w))
  return words.length >= 2 ? [...words].sort().join(' ') : null
}
const upstreamByKey = new Map()
for (const e of upstream) {
  const k = wordKey(e.name)
  if (k && !upstreamByKey.has(k)) upstreamByKey.set(k, e)
}

// 1) 存量回填
const backfillLines = []
const matched = []
const unmatched = []
const matchedUpstreamNames = new Set()
for (const row of existing) {
  let up = null
  for (const v of nameVariants(row.nameEn)) {
    up = byNameEn.get(v)
    if (up) break
  }
  if (!up) {
    const k = wordKey(row.nameEn)
    if (k) up = upstreamByKey.get(k)
  }
  if (up) matchedUpstreamNames.add(up.name.toLowerCase())
  let bodyPart, equipment, primary, secondary, secondaries
  if (up) {
    bodyPart = up.bodyPart
    equipment = equipmentOf(up.equipmentRaw, up.name)
    primary = canonicalOrNull(up.primaryRaw)
    secondary = canonicalOrNull(up.secondaryRaw)
    secondaries = [...new Set(up.secondariesRaw.map(canonicalOrNull).filter(Boolean))]
      .filter(s => s !== primary)
    matched.push(row.nameEn)
  } else {
    primary = canonicalOrNull(row.muscleGroup)
    bodyPart = primary ? PRIMARY_TO_BODYPART[primary] ?? null : null
    equipment = equipmentOf(row.nameEn)
    secondary = null
    secondaries = []
    unmatched.push({ name: row.name, nameEn: row.nameEn, muscleGroup: row.muscleGroup, primary })
  }
  backfillLines.push(
    `UPDATE exercise SET body_part=${sqlStr(bodyPart)}, equipment=${sqlStr(equipment)}, ` +
    `primary_muscle=${sqlStr(primary)}, secondary_muscle=${sqlStr(secondary)}, ` +
    `secondary_muscles=${sqlJson(secondaries)}, source='system' ` +
    `WHERE name_en=${sqlStr(row.nameEn)} AND is_system=1;`,
  )
}
console.log(`存量匹配上游：${matched.length} 条；未匹配（按中文肌肉名推导）：${unmatched.length} 条`)
for (const u of unmatched) console.log(`  - ${u.name}（${u.muscleGroup} → ${u.primary ?? '未识别'}）`)

// 2) 上游导入集合（去掉与存量重名/变体重名的）
const existingNames = new Set()
for (const r of existing) {
  for (const v of nameVariants(r.nameEn)) existingNames.add(v)
}
const toInsert = []
const seen = new Set()
for (const e of upstream) {
  const key = e.name.toLowerCase()
  if (existingNames.has(key) || matchedUpstreamNames.has(key) || seen.has(key)) continue
  seen.add(key)
  const primary = canonicalOrNull(e.primaryRaw)
  const secondary = canonicalOrNull(e.secondaryRaw)
  const secondaries = [...new Set(e.secondariesRaw.map(canonicalOrNull).filter(Boolean))]
    .filter(s => s !== primary)
  toInsert.push({
    id: e.id,
    name: e.name,
    nameEn: e.name,
    category: 'opengym',
    categoryType: e.categoryEn,
    muscleGroup: primary ? slugToZh[primary] ?? primary : null,
    difficulty: 2,
    description: '',
    professionalTips: '',
    isSystem: 1,
    bodyPart: e.bodyPart ?? (primary ? PRIMARY_TO_BODYPART[primary] ?? null : null),
    equipment: equipmentOf(e.equipmentRaw, e.name),
    primary,
    secondary,
    secondaries,
    source: 'opengym',
    sourceId: e.id,
  })
}
console.log(`待导入上游动作：${toInsert.length} 条`)

// 3) 写 DDL
const ddl = `-- ============================================================
-- openGym 整合：exercise 表结构扩展（阶段 2）
-- 生成：scripts/opengym-exercise-import.mjs（上游 commit e348fc1）
-- 说明：一次性迁移；如列已存在请忽略对应报错。
-- ============================================================
ALTER TABLE exercise
  ADD COLUMN body_part        VARCHAR(64)  NULL COMMENT '身体部位（上游 bp）',
  ADD COLUMN equipment        VARCHAR(64)  NULL COMMENT '器械（规范值）',
  ADD COLUMN primary_muscle   VARCHAR(64)  NULL COMMENT '主肌肉（规范 slug）',
  ADD COLUMN secondary_muscle VARCHAR(64)  NULL COMMENT '次要肌肉（规范 slug）',
  ADD COLUMN secondary_muscles VARCHAR(512) NULL COMMENT '次要肌肉列表 JSON',
  ADD COLUMN category_en      VARCHAR(64)  NULL COMMENT '英文分类（上游 cat）',
  ADD COLUMN source           VARCHAR(16)  NULL DEFAULT 'user' COMMENT '来源：system/opengym/user',
  ADD COLUMN source_id        VARCHAR(16)  NULL COMMENT '上游动作 id';

-- 按来源筛选（App 可选只显示 system/opengym 子集）
ALTER TABLE exercise ADD INDEX idx_exercise_source (source);
`
fs.writeFileSync(OUT_SCHEMA, ddl, 'utf8')

// 4) 写回填
const backfill = `-- ============================================================
-- openGym 整合：存量动作结构化字段回填
-- 生成：scripts/opengym-exercise-import.mjs（上游 commit e348fc1）
-- 共 ${backfillLines.length} 条：与上游匹配的取其 bp/eq/tg/mg/sm；
-- 未匹配的按中文肌肉名（muscles-zh 规则）与动作名器械关键词推导。
-- ============================================================
${backfillLines.join('\n')}
`
fs.writeFileSync(OUT_BACKFILL, backfill, 'utf8')

// 5) 写导入数据（临时表 + 去重插入）
const COLS = ['name', 'name_en', 'category', 'category_type', 'muscle_group', 'difficulty_level',
  'description', 'professional_tips', 'is_system', 'body_part', 'equipment', 'primary_muscle',
  'secondary_muscle', 'secondary_muscles', 'source', 'source_id']
const rowSql = r => `(${[
  sqlStr(r.name), sqlStr(r.nameEn), sqlStr(r.category), sqlStr(r.categoryType),
  sqlStr(r.muscleGroup), r.difficulty, sqlStr(r.description), sqlStr(r.professionalTips),
  r.isSystem, sqlStr(r.bodyPart), sqlStr(r.equipment), sqlStr(r.primary),
  sqlStr(r.secondary), sqlJson(r.secondaries), sqlStr(r.source), sqlStr(r.sourceId),
].join(',')})`

const BATCH = 500
let dataSql = `-- ============================================================
-- openGym 整合：上游动作批量导入（阶段 2）
-- 生成：scripts/opengym-exercise-import.mjs（上游 commit e348fc1）
-- 共 ${toInsert.length} 条；经临时表按 name_en 去重后插入，存量动作不受影响。
-- 合规：仅文本与结构数据，无媒体字段（上游动画素材版权仅限 openGym 使用）。
-- ============================================================
SET NAMES utf8mb4;

CREATE TEMPORARY TABLE tmp_opengym_exercise (
  name               VARCHAR(255) NOT NULL,
  name_en            VARCHAR(255) NOT NULL,
  category           VARCHAR(64)  NULL,
  category_type      VARCHAR(64)  NULL,
  muscle_group       VARCHAR(128) NULL,
  difficulty_level   INT          NULL,
  description        TEXT         NULL,
  professional_tips  TEXT         NULL,
  is_system          INT          NULL,
  body_part          VARCHAR(64)  NULL,
  equipment          VARCHAR(64)  NULL,
  primary_muscle     VARCHAR(64)  NULL,
  secondary_muscle   VARCHAR(64)  NULL,
  secondary_muscles  VARCHAR(512) NULL,
  source             VARCHAR(16)  NULL,
  source_id          VARCHAR(16)  NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

`
for (let i = 0; i < toInsert.length; i += BATCH) {
  const batch = toInsert.slice(i, i + BATCH)
  dataSql += `INSERT INTO tmp_opengym_exercise (${COLS.join(', ')}) VALUES\n${batch.map(rowSql).join(',\n')};\n\n`
}
dataSql += `INSERT INTO exercise (${COLS.join(', ')})
SELECT ${COLS.map(c => `t.${c}`).join(', ')}
FROM tmp_opengym_exercise t
LEFT JOIN exercise e ON e.name_en = t.name_en
WHERE e.id IS NULL;

DROP TEMPORARY TABLE tmp_opengym_exercise;
`
fs.writeFileSync(OUT_DATA, dataSql, 'utf8')

// 6) 写 JSON 数据集
const dataset = toInsert.map(r => ({
  id: r.sourceId,
  name: r.name,
  nameEn: r.nameEn,
  bodyPart: r.bodyPart,
  equipment: r.equipment,
  primaryMuscle: r.primary,
  secondaryMuscle: r.secondary,
  secondaryMuscles: r.secondaries,
  categoryEn: r.categoryType,
}))
fs.writeFileSync(OUT_JSON, JSON.stringify(dataset), 'utf8')

console.log('\n输出文件：')
for (const f of [OUT_SCHEMA, OUT_BACKFILL, OUT_DATA, OUT_JSON]) {
  console.log(`  ${path.relative(REPO_ROOT, f)}  ${(fs.statSync(f).size / 1024).toFixed(0)} KB`)
}
console.log('\n下一步：在数据库依次执行 07 → 08 → 09。')
