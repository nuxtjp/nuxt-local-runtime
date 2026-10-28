import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, symlinkSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { applySecurityPatches } from '../security/project.mjs'
const policy = JSON.parse(readFileSync(new URL(import.meta.resolve('@nuxtjp/dependency-security/policy')), 'utf8'))
function fixture(fn: (root: string) => void) {
  const root = mkdtempSync(join(tmpdir(), 'nuxtjp-patch-test-'))
  try { fn(root) } finally { rmSync(root, { recursive: true, force: true }) }
}
test('explicit application preserves unrelated settings and is idempotent', () => fixture(root => {
  writeFileSync(join(root, 'package.json'), JSON.stringify({ private: true, pnpm: { overrides: { sample: '1.0.0' } } }))
  applySecurityPatches(root)
  const before = readFileSync(join(root, 'package.json'))
  applySecurityPatches(root)
  assert.deepEqual(readFileSync(join(root, 'package.json')), before)
  const data = JSON.parse(before)
  assert.deepEqual(data.pnpm.overrides, { sample: '1.0.0', ...policy.overrides })
  assert.deepEqual(Object.keys(data.pnpm.patchedDependencies), ['braces@3.0.3'])
  assert.equal('simple-git@4.0.2' in data.pnpm.patchedDependencies, false)
}))
test('conflicting configuration is rejected without changing the manifest', () => fixture(root => {
  const original = JSON.stringify({ pnpm: { patchedDependencies: { 'braces@3.0.3': 'custom.patch' } } })
  writeFileSync(join(root, 'package.json'), original)
  assert.throws(() => applySecurityPatches(root), /conflicts/)
  assert.equal(readFileSync(join(root, 'package.json'), 'utf8'), original)
}))
test('symlink patch storage is rejected before writing outside the project', () => fixture(root => {
  writeFileSync(join(root, 'package.json'), '{}')
  mkdirSync(join(root, 'outside'))
  symlinkSync(join(root, 'outside'), join(root, '.nuxtjp-security'))
  assert.throws(() => applySecurityPatches(root), /real directory/)
}))

import { createRequire } from 'node:module'
const { installedDependencies } = createRequire(import.meta.url)('../security/resolved-dependency.cjs')
test('dependency regressions follow the active graph and ignore unused store copies', () => fixture(root => {
  writeFileSync(join(root, 'package.json'), JSON.stringify({ dependencies: { braces: '3.0.3' } }))
  const active = join(root, 'node_modules', 'braces')
  const unused = join(root, 'node_modules', '.pnpm', 'unused', 'node_modules', 'braces')
  mkdirSync(active, { recursive: true })
  mkdirSync(unused, { recursive: true })
  for (const folder of [active, unused]) {
    writeFileSync(join(folder, 'package.json'), JSON.stringify({ name: 'braces', version: '3.0.3' }))
  }
  assert.deepEqual(installedDependencies(root, 'braces', '3.0.3'), [join(active, 'package.json')])
}))

test('conflicting version selectors reject before project or patch mutation', () => fixture(root => {
  const original = JSON.stringify({ pnpm: { overrides: { 'nuxt>simple-git@*': '4.0.1' } } })
  writeFileSync(join(root, 'package.json'), original)
  assert.throws(() => applySecurityPatches(root), /override conflicts/)
  assert.equal(readFileSync(join(root, 'package.json'), 'utf8'), original)
}));

test('Git compatibility patch is configured only when the application has an active Git dependency', () => fixture(root => {
  writeFileSync(join(root, 'package.json'), JSON.stringify({ dependencies: { 'simple-git': '4.0.2' } }))
  const folder = join(root, 'node_modules', 'simple-git')
  mkdirSync(folder, { recursive: true })
  writeFileSync(join(folder, 'package.json'), JSON.stringify({ name: 'simple-git', version: '4.0.2' }))
  applySecurityPatches(root)
  const data = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  assert.equal(Object.keys(data.pnpm.patchedDependencies).length, 2)
  assert.equal(data.pnpm.patchedDependencies['simple-git@4.0.2'], '.nuxtjp-security/simple-git-4.0.2.patch')
}))
