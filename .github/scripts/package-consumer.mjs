import { mkdtempSync, writeFileSync, readFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync, spawn } from 'node:child_process'
import assert from 'node:assert/strict'
const archive = resolve(process.argv[2])
const root = mkdtempSync(join(tmpdir(), 'local-runtime-consumer-'))
const source = join(root, 'source'); mkdirSync(source)
const rc = join(root, 'empty.npmrc'); writeFileSync(rc, '')
const globalRc = join(root, 'empty-global.npmrc'); writeFileSync(globalRc, '')
const env = { ...process.env, NPM_CONFIG_USERCONFIG: rc, NPM_CONFIG_GLOBALCONFIG: globalRc, NPM_CONFIG_CACHE: join(root, 'empty-cache'), npm_config_registry: 'https://registry.npmjs.org', NUXT_TELEMETRY_DISABLED: '1', CI: 'true' }
for (const k of ['NPM_TOKEN', 'NODE_AUTH_TOKEN', 'GH_TOKEN', 'GITHUB_TOKEN']) delete env[k]
function run(args) { const p = spawnSync(args[0], args.slice(1), { cwd: source, env, encoding: 'utf8', timeout: 600000 }); console.log(p.stdout ?? ''); console.error(p.stderr ?? ''); assert.equal(p.status, 0, args.join(' ')) }
writeFileSync(join(source, 'package.json'), JSON.stringify({ private: true, type: 'module', dependencies: { '@nuxtjp/local-runtime': `file:${archive}`, nuxt: '4.5.1', vue: '3.5.43' }, devDependencies: { typescript: '5.9.3', 'vue-tsc': '3.2.8', '@types/node': '24.12.0' } }, null, 2))
run(['npm', 'install', '--ignore-scripts', '--no-fund', '--registry=https://registry.npmjs.org'])
const lock = JSON.parse(readFileSync(join(source, 'package-lock.json')))
for (const [name, value] of Object.entries(lock.packages)) {
 if (name && name !== 'node_modules/@nuxtjp/local-runtime' && value.resolved) assert.ok(value.resolved.startsWith('https://registry.npmjs.org/'), name)
}
writeFileSync(join(source, 'runtime.mjs'), `import assert from 'node:assert/strict'
import module from '@nuxtjp/local-runtime'
import { LocalRuntimeClient, requireLoopbackEndpoint, bandAllowsTarget } from '@nuxtjp/local-runtime/client'
import { isLocalRuntimeManifest, isSessionGrant, isViewEnvelope } from '@nuxtjp/local-runtime/guards'
import schema from '@nuxtjp/local-runtime/schema' with { type: 'json' }
assert.ok(module); assert.equal(typeof LocalRuntimeClient, 'function')
assert.equal(requireLoopbackEndpoint('http://127.0.0.1:37843').port, '37843')
assert.throws(() => requireLoopbackEndpoint('https://example.invalid'))
assert.equal(bandAllowsTarget('sealed', 'public-network'), false)
for (const guard of [isLocalRuntimeManifest, isSessionGrant]) assert.equal(guard({}), false)
assert.equal(isViewEnvelope({}, { id: 'synthetic', fields: [] }), false)
assert.ok(schema); console.log('runtime/client/guards/schema entries passed')
`)
run(['node', 'runtime.mjs'])
writeFileSync(join(source, 'types.ts'), `import localModule, { type ModuleOptions } from '@nuxtjp/local-runtime'
import { LocalRuntimeClient } from '@nuxtjp/local-runtime/client'
import { isLocalRuntimeManifest } from '@nuxtjp/local-runtime/guards'
import type { LocalRuntimeState, LocalRuntimeManifest } from '@nuxtjp/local-runtime/types'
const options: ModuleOptions = { endpoint: 'http://127.0.0.1:37843', componentPrefix: 'Synthetic' }
const state: LocalRuntimeState = { phase: 'idle', manifest: null, error: null }
const accepted: boolean = isLocalRuntimeManifest(state.manifest)
const manifest: LocalRuntimeManifest | null = state.manifest
void [localModule, options, state, accepted, manifest, LocalRuntimeClient]
`)
run(['npx', '--no-install', 'tsc', '--noEmit', '--strict', '--skipLibCheck', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', '--target', 'ES2022', 'types.ts'])
writeFileSync(join(source, 'nuxt.config.ts'), `export default defineNuxtConfig({ devtools: { enabled: false }, modules: ['@nuxtjp/local-runtime'], nuxtJpLocalRuntime: { endpoint: 'http://127.0.0.1:37843', componentPrefix: 'Synthetic' } })\n`)
mkdirSync(join(source, 'app'))
writeFileSync(join(source, 'app/app.vue'), `<script setup lang="ts">const runtime = useLocalRuntime()</script><template><main><h1>Synthetic local runtime host</h1><SyntheticLocalRuntimeStatus :state="runtime.state.value" /></main></template>\n`)
writeFileSync(join(source, 'tsconfig.json'), JSON.stringify({ files: [], references: ['app', 'server', 'shared', 'node'].map(x => ({ path: `./.nuxt/tsconfig.${x}.json` })) }, null, 2))
run(['npx', '--no-install', 'nuxt', 'prepare'])
run(['npx', '--no-install', 'nuxt', 'typecheck'])
run(['npx', '--no-install', 'nuxt', 'build'])
const server = spawn('node', ['.output/server/index.mjs'], { cwd: source, env: { ...env, NITRO_HOST: '127.0.0.1', NITRO_PORT: '19386' }, stdio: ['ignore', 'pipe', 'pipe'] })
let errors = ''; server.stderr.on('data', x => { errors += x })
try {
 let response
 for (let i = 0; i < 50; i++) { try { response = await fetch('http://127.0.0.1:19386'); break } catch { await new Promise(r => setTimeout(r, 100)) } }
 assert.ok(response, errors); assert.equal(response.status, 200)
 const html = await response.text(); assert.ok(html.includes('Synthetic local runtime host'))
 assert.ok(html.includes('idle')); assert.ok(!html.includes('connecting')); assert.ok(!html.includes('unavailable'))
 console.log(JSON.stringify({ root, archive, freshInstall: 'pass: public dependencies only', types: 'pass: NodeNext and Nuxt app', build: 'pass', SSR: 'pass: initial idle state' }))
} finally { if (server.exitCode === null) { server.kill('SIGTERM'); await new Promise(r => { server.once('exit', r); setTimeout(r, 5000).unref() }) } }
