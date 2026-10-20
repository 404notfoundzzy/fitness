import fs from 'node:fs'
const src = fs.readFileSync('d:/softWare/develop/app-myself/fitness/integrations/openGym/frontend/src/lib/exercises-data.js', 'utf8')
const marker = 'export const EXDB='
const start = src.indexOf(marker) + marker.length
const endMatch = src.slice(start).match(/\](?=\r?\n|;|$)/)
const db = JSON.parse(src.slice(start, start + endMatch.index + 1))
const show = (re, n = 8) => {
  console.log('---', re)
  db.filter(e => re.test(e.n)).slice(0, n).forEach(e => console.log('   ', e.id, JSON.stringify(e.n), 'eq=' + e.eq, 'tg=' + e.tg))
}
show(/incline.*bench/i)
show(/romanian/i)
show(/cable crossover/i)
show(/arnold/i)
show(/bulgarian/i)
