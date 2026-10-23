// Compatibility entry point; regressions execute only after explicit invocation.
void import('@nuxtjp/dependency-security').then(({ verifyProject }) => {
 const result = verifyProject(process.cwd())
 process.stdout.write(result.stdout); process.stderr.write(result.stderr); process.exitCode = result.exitCode
}).catch(() => { console.error('Selected dependency graph cannot be verified'); process.exitCode = 2 })
