#!/usr/bin/env node
/** Apply reviewed Nuxt dependency backports to an explicitly selected pnpm project. */
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import { applySecurityPatches } from './project.mjs'

const args = process.argv.slice(2)
if (args.length !== 3 || args[0] !== '--project-root' || args[2] !== '--apply') {
  console.error('Usage: node apply.mjs --project-root PROJECT --apply')
  process.exitCode = 2
} else {
  try {
    applySecurityPatches(args[1], dirname(fileURLToPath(import.meta.url)))
    console.log('Reviewed backports configured. Run pnpm install --no-frozen-lockfile to refresh the lockfile.')
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
