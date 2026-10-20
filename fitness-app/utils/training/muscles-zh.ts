// 中文肌肉名规范化（Chinese muscle name canonicalization）
//
// 健身小助手现有 exercise 表的 muscle_group 是中文自由文本（"胸大肌上部"、
// "腘绳肌-大腿后侧"、"三角肌前/中束"），无法直接喂给 muscles.ts 的规范 slug 体系。
// 本模块提供中文关键词 → 规范 slug 的有序匹配（具体先于笼统），复合文本按书写
// 顺序取第一个可识别段，使存量数据无需人工逐条标注即可进入肌肉映射算法。
//
// 规则数据与导入脚本共用同一份：./muscles-data.mjs

export { canonicalizeZhMuscle } from './muscles-data.mjs'
