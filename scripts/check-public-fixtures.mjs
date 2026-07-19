import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const defaultsPath = join(root, 'src/data/defaults.ts')
const defaults = readFileSync(defaultsPath, 'utf8')
const failures = []

if (!/shifts:\s*\[\s*\]/s.test(defaults)) failures.push('src/data/defaults.ts must contain an empty shifts seed')
if (/calendarConnection\s*:/.test(defaults)) failures.push('src/data/defaults.ts must not seed a calendar connection')
if (existsSync(join(root, 'src/data/calendarSnapshot.ts'))) failures.push('calendar snapshots must not be committed')

const secretPatterns = [
  [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, 'private key'],
  [/\bgithub_pat_[A-Za-z0-9_]{40,}\b/, 'GitHub token'],
  [/\bsb_secret_[A-Za-z0-9_-]{20,}\b/, 'Supabase secret'],
  [/\bAIza[0-9A-Za-z_-]{30,}\b/, 'Google API key'],
  [/https:\/\/[^\s'"`]+\.icloud\.com\/published\//i, 'published iCloud bearer URL'],
]

function walk(directory) {
  readdirSync(directory).forEach((name) => {
    if (['.git', 'node_modules', 'dist'].includes(name)) return
    const path = join(directory, name)
    if (statSync(path).isDirectory()) return walk(path)
    if (path === new URL(import.meta.url).pathname) return
    if (!/\.(?:ts|tsx|js|mjs|json|md|yml|yaml|html|css)$/.test(name)) return
    const content = readFileSync(path, 'utf8')
    secretPatterns.forEach(([pattern, label]) => {
      if (pattern.test(content)) failures.push(`${relative(root, path)} contains a possible ${label}`)
    })
  })
}

walk(root)
if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exit(1)
}
console.log('Public fixture and high-signal secret checks passed.')
