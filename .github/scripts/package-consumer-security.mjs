import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

// Install the exact archive and verify consumer-applied backports against its active graph.
const [input, name] = process.argv.slice(2)
assert.ok(input && /^@nuxtjp\/[a-z-]+$/.test(name ?? ''))
const project = mkdtempSync(join(tmpdir(), 'nuxtjp-security-consumer-'))
const pm = ['npm', 'exec', '--yes', '--ignore-scripts', '--package=pnpm@10.29.3', '--', 'pnpm']
const run = args => {
 const result = spawnSync(args[0], args.slice(1), { cwd: project, encoding: 'utf8',
  timeout: 600000, env: { ...process.env, CI: 'true', NUXT_TELEMETRY_DISABLED: '1' } })
 process.stdout.write(result.stdout ?? '')
 process.stderr.write(result.stderr ?? '')
 assert.equal(result.status, 0, args.join(' '))
}
writeFileSync(join(project, 'package.json'), JSON.stringify({ private: true, type: 'module',
 packageManager: 'pnpm@10.29.3', dependencies: { [name]: `file:${resolve(input)}`,
 nuxt: '4.5.2', vue: '3.5.43', '@nuxt/ui': '4.11.3', '@nuxt/icon': '2.5.1' } }, null, 2))
run([...pm, 'install', '--no-frozen-lockfile', '--ignore-scripts'])
run(['node', `node_modules/${name}/security/apply.mjs`, '--project-root', '.', '--apply'])
run([...pm, 'install', '--no-frozen-lockfile', '--ignore-scripts'])
run([...pm, 'install', '--frozen-lockfile', '--ignore-scripts'])
run(['node', `node_modules/${name}/security/dependency-security.check.cjs`])
