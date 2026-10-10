# @nuxtjp/local-runtime

[日本語](README.ja.md)

Connect a browser interface to one explicitly configured local Rust runtime, after an explicit user operation.

## Install and use

Version `0.1.1` is published on npm. Use Node `^22.19.0` or `^24.11.0`, Nuxt `^4.5.1` and Vue `^3.5.40`.

```sh
npm install @nuxtjp/local-runtime@0.1.0
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

The verification inputs pin Nuxt/kit/schema to `4.5.2`, Vue to `3.5.43` and Vitest to `4.1.11`. Compatible dependency fixes remove advisories; assess remaining advisories and untested environments before a release. Node and host compatibility floors were raised to match Nuxt.
The module/client API, loopback endpoint rules, explicit connection behavior and license terms are retained.
A local TGZ test proves archive behavior, not registry availability. Operations, deployment and publication require their own permissions and settings.

## Documentation and license

[Usage guide](https://github.com/nuxtjp/nuxt-local-runtime/blob/main/docs/getting-started.md) · [Schemas](schemas) · [Source](https://github.com/nuxtjp/nuxt-local-runtime/tree/main/src) · [Tests](https://github.com/nuxtjp/nuxt-local-runtime/tree/main/test) · [Contributing](https://github.com/nuxtjp/nuxt-local-runtime/blob/main/CONTRIBUTING.md) · [Security reporting](https://github.com/nuxtjp/nuxt-local-runtime/blob/main/SECURITY.md)

Code: [Apache-2.0](LICENSE). Retain [NOTICE](NOTICE) and the prior grants in [LICENSE-PREVIOUS](LICENSE-PREVIOUS).

## Consumer dependency security

See [dependency security backports](security/README.md) before installing this package in a Nuxt application. pnpm consumers must explicitly apply the included backports and verify their locked dependency tree; ordinary npm installation does not apply them.
