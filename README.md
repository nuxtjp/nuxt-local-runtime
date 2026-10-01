# @nuxtjp/local-runtime

A product-neutral Nuxt module for explicitly connecting a browser UI to one
local Rust runtime. It owns the loopback transport, closed runtime contracts,
information-band rules, bounded responses, and a small connection-status UI.

It does not discover files, call ecosystem services directly, store provider
credentials, execute HATs, require Hatter, or send local data to a control
plane. A product such as NERP or Hibee supplies its allowed web origin,
requested capabilities, and presentation components.

## Security model

The default is closed:

- only numeric loopback endpoints are accepted;
- connection starts only after an explicit `connect()` call;
- redirects, cookies, ambient credentials, and referrers are prohibited;
- response size and request size are bounded;
- unknown fields and expanded security bands fail validation;
- each capability declares an exact scalar payload schema which is rechecked
  before product code receives a view;
- `sealed` and `local` records cannot be returned to a browser;
- external egress is not implemented by this package.

The information bands are:

| Band | Permitted boundary |
| --- | --- |
| `sealed` | originating process only |
| `local` | authenticated local service mesh |
| `session` | paired loopback browser session |
| `control` | minimal external account/control metadata |
| `public` | explicitly approved public information |

`control` and `public` describe contracts. This client still has no method for
external transmission.

## Nuxt usage

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
    ローカルランタイムへ接続
  </button>
</template>
```

The host must separately allow the page origin. Browser Local Network Access
permission remains a user- and browser-controlled gate.

## Independent verification

```bash
pnpm install --offline --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
```

The build also compiles `playground/` as a real Nuxt consumer. It renders a
user-operated connect button and never opens a local session during SSR or
page load.

The package is independent of NERP, Ecosystem Control, Hatter, and any individual
ecosystem service.
