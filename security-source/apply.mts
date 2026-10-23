#!/usr/bin/env node
// Compatibility CLI: the shared tool owns policy, patches and validation.
import { applySecurityPatches } from '@nuxtjp/dependency-security'
const args = process.argv.slice(2)
if (args.length !== 3 || args[0] !== '--project-root' || args[2] !== '--apply') {
 console.error('Usage: node apply.mjs --project-root PROJECT --apply'); process.exitCode = 2
} else {
 try { applySecurityPatches(args[1]!); console.log('Reviewed backports configured. Run pnpm install --no-frozen-lockfile to refresh the lockfile.') }
 catch { console.error('Selected project configuration could not be applied; review manifest and patch conflicts.'); process.exitCode = 1 }
}
