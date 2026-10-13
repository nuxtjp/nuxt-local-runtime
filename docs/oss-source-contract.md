# OSS source contract: nuxtjp/nuxt-local-runtime

利用者の明示操作で、ブラウザ画面から設定済みのローカルRust環境へ接続できます。 / Connect a browser interface to one explicitly configured local Rust runtime.

## Responsibility boundary

Own the documented Nuxt/browser interface and its public contracts. Account authority, external effects, product state and production hosting remain explicit consumer responsibilities.

Same-function managed packages take priority when their actual capabilities fit. Do not add an unrelated dependency merely to connect organizations. Preserve upstream LICENSE/NOTICE and immutable release/history evidence; unused compatibility sources belong in Git history, not the supported API.

## Package ownership

| Manifest | Package | Distribution policy |
| --- | --- | --- |
| `crates/rust-v8-local-runtime/Cargo.toml` | `nuxtjp-local-runtime-host` | source-only; publish=false |
| `package.json` | `@nuxtjp/local-runtime` | npm candidate; verify official version/provenance |

Manifest versions and publish flags are declarations, not proof of published availability. Public npm exports and Rust implementation/docs belong to the manifests above; generated dist and sibling checkouts are not source-of-truth implementations.

## Source completion criteria

1. The documented purpose, public exports, validators/schema and actual implementation agree. Remove only confirmed-unused aliases, schemas and compatibility adapters after checking consumers; a shared field name does not imply a shared trust responsibility.
2. Runtime and official dependency resolution work from an independent checkout with committed locks. No local sibling artifact, private registry or ambient owner credential is required for the OSS source path.
3. Supported behavior has reproducible examples/playground and functional tests, including invalid input and relevant failure/cancellation/replay/tenant boundaries. A policy-only CI or planning fixture does not prove external effects.
4. CI runs the declared functional acceptance without disguising skipped/unavailable checks as success. Changed public package bytes receive a new reviewed release; immutable old versions are never overwritten.
5. License/NOTICE, security reporting, usage and the actual supported/unsupported scope stay in the owning repository. The owner operates independently of a central private management checkout.
6. Source acceptance, artifact/registry acceptance and production deployment are separate records. This document defines the target; it does not declare unexecuted tests, unreleased APIs or live-account validation completed.

## Existing verification entrypoints

- [.github/workflows/oss-policy.yml](../.github/workflows/oss-policy.yml)
- [.github/workflows/publish-npm.yml](../.github/workflows/publish-npm.yml)
- [.github/workflows/source-history.yml](../.github/workflows/source-history.yml)
- [.github/workflows/verify-package.yml](../.github/workflows/verify-package.yml)

Use the package scripts/owner CI above and the repository README for exact commands. When schema files exist, their canonical validator and consumer must be checked together; deleting a definition on a text search alone is insufficient.

## Acceptance record

Inventory baseline source: `26d3e1156dec5a1fed75cb013a118f31a0ef1622`. This baseline records observed files and declared interfaces, not a completed audit. Subsequent source changes are accepted at their exact commit with test evidence. Production hosting, account login, secret custody installation and data migration remain outside source-only acceptance.
