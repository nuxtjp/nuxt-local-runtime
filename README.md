# @nuxtjp/local-runtime

利用者の明示操作で、ブラウザ画面から設定済みのローカルRust環境へ接続できます。

## 利用前の確認

実装済みの範囲、必要な依存関係、検証コマンドを以下の英語説明に併記しています。操作・配備・公開は、それぞれの権限と設定を確認してから実施してください。

## 導入・使い方

以下は現行 API の利用例です。npm 上の配布状況を確認してから、対応版を install してください。ローカル TGZ の試験成功は、registry 配布の確認には含めません。

```sh
npm install @nuxtjp/local-runtime@0.1.0
```

Node ^22.19.0 / ^24.11.0、Nuxt ^4.5.1、Vue ^3.5.40 が必要です。

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

## English

Connect a browser interface to one explicitly configured local Rust runtime.

## What you can do

- Start a connection only after an explicit user operation.
- Validate bounded loopback responses and display connection state.

## Current scope

The application supplies the allowed origin and capabilities. There is no automatic resource discovery or persistent credential storage.

Check npm availability before installation. Required hosts: Node ^22.19.0 or ^24.11.0, Nuxt ^4.5.1 and Vue ^3.5.40.
The client and guards subpaths ship JavaScript and declarations; /types exposes the existing raw TypeScript definitions for type-only imports. /schema exposes the JSON schema.
A Nuxt build must render the initial idle state without connecting to a runtime; connect() remains an explicit browser action.

## Getting started

Use `pnpm@10.29.3` and the Node.js version declared in `engines` in `package.json`. Run from this repository:

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
```

## Documentation and source

[Usage guide](https://github.com/nuxtjp/nuxt-local-runtime/blob/main/docs/getting-started.md)

[Schemas](schemas) · [Implementation and public interfaces](https://github.com/nuxtjp/nuxt-local-runtime/tree/main/src) · [Verification cases](https://github.com/nuxtjp/nuxt-local-runtime/tree/main/test) · [Contributing](https://github.com/nuxtjp/nuxt-local-runtime/blob/main/CONTRIBUTING.md) · [Security reporting](https://github.com/nuxtjp/nuxt-local-runtime/blob/main/SECURITY.md) · [License](LICENSE) · [Attribution notices](NOTICE)

## Candidate changes

Direct Nuxt/kit/schema pins 4.5.1, Vue 3.5.43 and Vitest 4.1.11 update the verification inputs; refreshed dependencies remove advisories with compatible fixes. Node and host compatibility floors were raised to match Nuxt.
The module/client API, loopback endpoint rules, explicit connection behavior and license terms are retained. Remaining advisories and untested environments must be assessed before release.
