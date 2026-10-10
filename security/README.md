# Dependency security backports

Two upstream dependencies have no fixed release: braces 3.0.3 (GHSA-vfj7-8cjw-p6xm) and node-forge 1.4.0 (GHSA-86w9-cpqp-85rv). The included patches bound brace AST recursion and reject malformed RSA DigestAlgorithm parameters. Regression tests cover ordinary behavior and the malicious input shapes.

The package is distributed through npm. A consumer must use pnpm 10 and explicitly configure the reviewed backports at its project root. Dependency packages cannot impose root-level npm overrides or pnpm patches on a consuming application. Installing this module alone does not apply the patches.

```sh
node node_modules/@nuxtjp/local-runtime/security/apply.mjs --project-root . --apply
pnpm install --no-frozen-lockfile
pnpm install --frozen-lockfile
```

Commit the generated `.nuxtjp-security/*.patch`, `package.json`, and lockfile in your application. The command does not run installs, access the network, or replace an existing conflicting patch. It preserves unrelated pnpm settings. Each root application must apply the patches, including CI checkouts.

Run `node node_modules/@nuxtjp/local-runtime/security/dependency-security.check.cjs` after installing the locked project to verify that the actual resolved dependencies reject the affected inputs. These are backports, not upstream fixed versions. Version-only advisory tools still report the two vulnerable upstream versions; retain their findings and link the lockfile/patch hashes and regression results. Reapply and reverify when dependency versions change. npm-only consumers require a separately reviewed override distribution; they are not certified by this pnpm procedure.

The RSA test creates an ephemeral key in memory and never reads a user key. Patches contain code only and do not include credentials, customer content, or private endpoints.
