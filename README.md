# @nuxtjp/local-runtime

[日本語](README.ja.md)

Connect a browser interface to one explicitly configured local Rust runtime, after an explicit user operation.

## Install and use

Install the published version identified by `npm view @nuxtjp/local-runtime version`. Use Nuxt `^4.6.2`, Vue `^3.5.40`, and Node.js 22.19+ or 24.11+.

```sh
npm install @nuxtjp/local-runtime
```

```ts
export default defineNuxtConfig({
  modules: ['@nuxtjp/local-runtime'],
  nuxtJpLocalRuntime: {
    endpoint: 'http://127.0.0.1:37843'
  }
})
```

```vue
<script setup lang="ts">
const runtime = useLocalRuntime()

async function connect(): Promise<void> {
  await runtime.connect(['workflow.issue.read'])
}
</script>

<template>
  <NuxtJpLocalRuntimeStatus :state="runtime.state.value" />
  <button type="button" @click="connect">
    Connect to local runtime
  </button>
</template>
```

The host must separately allow the page origin. The application supplies the requested capabilities. Browser Local Network Access permission remains controlled by the user and browser.

## Scope and interfaces

- Start connections only after an explicit user operation.
- Validate bounded loopback responses and display connection state.
- Keep the initial Nuxt-rendered state idle. A build must not connect to a runtime; `connect()` remains an explicit browser action.

The application supplies allowed origins and capabilities. The module does not discover resources automatically or persist credentials.
The `/client` and `/guards` subpaths ship JavaScript and declarations. `/types` exposes the existing raw TypeScript definitions for type-only imports; `/schema` exposes the JSON schema.

## Development and verification

Use `pnpm@10.29.3` and a Node version accepted by `package.json`:

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
```

The exact verification dependencies are declared in package.json and pnpm-lock.yaml. Consumer CI exercises the reviewed archive and shared security tool; other environments require their own acceptance.
The module/client API, loopback endpoint rules, explicit connection behavior and license terms are retained.
A local TGZ test proves archive behavior, not registry availability. Operations, deployment and publication require their own permissions and settings.

## Documentation and license

[Usage guide](https://github.com/nuxtjp/nuxt-local-runtime/blob/main/docs/getting-started.md) · [Schemas](schemas) · [Source](https://github.com/nuxtjp/nuxt-local-runtime/tree/main/src) · [Tests](https://github.com/nuxtjp/nuxt-local-runtime/tree/main/test) · [Contributing](https://github.com/nuxtjp/nuxt-local-runtime/blob/main/CONTRIBUTING.md) · [Security reporting](https://github.com/nuxtjp/nuxt-local-runtime/blob/main/SECURITY.md)

Code: [Apache-2.0](LICENSE). Retain [NOTICE](NOTICE) and the prior grants in [LICENSE-PREVIOUS](LICENSE-PREVIOUS).

## Consumer dependency security

See [dependency security backports](security/README.md) before installing this package in a Nuxt application. pnpm consumers must explicitly apply the included backports and verify their locked dependency tree; ordinary npm installation does not apply them.

[OSS responsibility and source completion](docs/oss-source-contract.md) defines the supported package boundary and required acceptance. It does not declare unexecuted source, distribution or production checks complete.

Dependency updates: [repository policy](docs/dependency-updates.md).
Registry releases: [version tags and GitHub OIDC](docs/registry-release.md).
