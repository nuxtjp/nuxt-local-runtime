# Dependency security maintenance

`@nuxtjp/dependency-security` owns the reviewed policy, patches, installed dependency resolver and regression checks. This module depends on that peer-free package; its `security/apply.mjs` and `security/dependency-security.check.cjs` paths are generated compatibility entry points and contain no independent policy.

```sh
pnpm exec nuxtjp-security-config --project-root . --apply
pnpm install --no-frozen-lockfile
pnpm install --frozen-lockfile
pnpm exec nuxtjp-security-check --project-root .
pnpm audit --json
```

Installation does not apply patches. Select the application explicitly and commit its generated patches, manifest and lockfile. Configuration rejects conflicts; only the shared policy's tested backport advisories may remain visible. An application build and type check with devtools enabled are required separately. Existing LICENSE-braces, LICENSE-node-forge and LICENSE-simple-git attribution is retained. Root `patches/` files are this repository's own build inputs, not another distributed security implementation.
