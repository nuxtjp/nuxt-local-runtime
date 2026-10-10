import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, readFileSync, cpSync } from 'node:fs'
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
 nuxt: '4.5.2', vue: '3.5.43', '@nuxt/ui': '4.11.3', '@nuxt/icon': '2.5.1', typescript: '5.9.3', 'vue-tsc': '3.2.8' } }, null, 2))
run([...pm, 'install', '--no-frozen-lockfile', '--ignore-scripts'])
run(['node', `node_modules/${name}/security/apply.mjs`, '--project-root', '.', '--apply'])
run([...pm, 'install', '--no-frozen-lockfile', '--ignore-scripts'])
run([...pm, 'install', '--frozen-lockfile', '--ignore-scripts'])
run(['node', `node_modules/${name}/security/dependency-security.check.cjs`])

// Retain known backport advisories; reject every other advisory and severity.
const policy = JSON.parse(readFileSync(new URL('../../security/dependency-versions.json', import.meta.url)))
const audited = spawnSync(pm[0], [...pm.slice(1), 'audit', '--json'], {
 cwd: project, encoding: 'utf8', timeout: 600000, env: process.env
})
assert.ok(audited.status === 0 || audited.status === 1, 'Dependency audit execution failed')
const report = JSON.parse(audited.stdout)
writeFileSync(join(project, 'dependency-audit.json'), JSON.stringify(report, null, 2))
for (const advisory of Object.values(report.advisories ?? {})) {
 assert.ok(policy.backportedAdvisories.includes(advisory.github_advisory_id), 'Unremediated advisory: ' + advisory.github_advisory_id)
}
for (const severity of ['critical', 'moderate', 'low']) {
 assert.equal(report.metadata.vulnerabilities[severity], 0, 'Unexpected ' + severity + ' vulnerabilities')
}
console.log(JSON.stringify({ versionOnlyAudit: report.metadata.vulnerabilities,
 backportsVerifiedByRegressions: policy.backportedAdvisories, report: 'dependency-audit.json' }))

// A successful advisory scan alone is insufficient: exercise an actual application with devtools.
if (name === '@nuxtjp/localized-site') {
 cpSync(new URL('../../examples/content', import.meta.url), join(project, 'content'), { recursive: true })
}
const modules = name === '@nuxtjp/localized-site' ? [[name, { contentRoot: './content' }]] : [name]
writeFileSync(join(project, 'nuxt.config.ts'), `export default defineNuxtConfig(${JSON.stringify({ modules, devtools: { enabled: true }, compatibilityDate: '2025-07-15' })})\n`)
writeFileSync(join(project, 'app.vue'), '<template><main>Distribution consumer verification</main></template>\n')
writeFileSync(join(project, 'tsconfig.json'), '{"extends":"./.nuxt/tsconfig.json"}\n')
run([...pm, 'exec', 'nuxt', 'build'])
run([...pm, 'exec', 'nuxt', 'typecheck'])
