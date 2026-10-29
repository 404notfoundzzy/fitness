// SFC 语法自检：不依赖 HBuilderX/uni 编译器，先用 @vue/compiler-sfc 把
// template / script / style 走一遍编译，尽早暴露模板表达式或脚本的语法错误。
//
// 用法：node scripts/check-sfc.mjs [文件或目录 ...]
// 默认检查 pages/ 与 components/ 下的全部 .vue

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { parse, compileTemplate, compileScript } from '@vue/compiler-sfc'

const roots = process.argv.slice(2)
if (!roots.length) roots.push('pages', 'components')

const files = []
function walk(p) {
  const abs = resolve(p)
  const st = statSync(abs)
  if (st.isDirectory()) {
    for (const name of readdirSync(abs)) {
      if (name === 'node_modules' || name === 'unpackage') continue
      walk(join(abs, name))
    }
    return
  }
  if (abs.endsWith('.vue')) files.push(abs)
}

for (const r of roots) walk(r)

let failed = 0
let skipped = 0
for (const file of files) {
  const source = readFileSync(file, 'utf8')
  if (!source.trim() || !/<(template|script)/.test(source)) {
    // 既没有 template 也没有 script 的不是组件（仓库里有历史遗留的 0 字节 .vue），跳过
    console.log(`- 跳过空文件 ${file}`)
    skipped++
    continue
  }
  try {
    const { descriptor, errors } = parse(source, { filename: file })
    if (errors && errors.length) throw errors[0]
    if (descriptor.script || descriptor.scriptSetup) {
      compileScript(descriptor, { id: file, inlineTemplate: false })
    }
    if (descriptor.template) {
      const res = compileTemplate({
        source: descriptor.template.content,
        filename: file,
        id: file,
      })
      if (res.errors && res.errors.length) throw res.errors[0]
    }
    for (const style of descriptor.styles || []) {
      if (style.lang && style.lang !== 'css') continue
      if (style.content.includes('{{')) throw new Error('style 中出现模板插值')
    }
  } catch (error) {
    failed++
    console.error(`✗ ${file}`)
    console.error(`  ${error.message || error}`)
  }
}

console.log(`\n检查 ${files.length} 个 SFC，失败 ${failed} 个，跳过空文件 ${skipped} 个`)
process.exit(failed ? 1 : 0)
