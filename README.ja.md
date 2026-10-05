# @nuxtjp/local-runtime

[English](README.md)

利用者の明示操作で、ブラウザ画面から設定済みのローカルRustランタイムへ接続します。

## 導入と使い方

`0.1.0`はnpmで公開済みです。Node `^22.19.0`または`^24.11.0`、Nuxt `^4.5.1`、Vue `^3.5.40`を使用してください。

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
    ローカルランタイムへ接続
  </button>
</template>
```

接続先のhostは、ページのoriginを別途許可する必要があります。要求するcapabilityは利用アプリが指定します。Browser Local Network Accessの許可は、利用者とブラウザが管理します。

## 責務と公開インターフェース

- 接続を始めるのは、利用者が明示的に操作した後だけです。
- 上限付きloopback応答を検証し、接続状態を表示します。
- Nuxtの初期表示はidleにします。build中に接続せず、`connect()`はブラウザでの明示操作として実行します。

許可originとcapabilityは利用アプリが指定します。リソースの自動探索や認証情報の永続保存は行いません。
`/client`と`/guards`はJavaScriptと型宣言を配布します。`/types`は型専用importのための既存TypeScript定義、`/schema`はJSON schemaを公開します。

## 開発と検証

`pnpm@10.29.3`と、`package.json`のenginesを満たすNodeを使用してください。

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
```

検証入力はNuxt/kit/schema `4.5.1`、Vue `3.5.43`、Vitest `4.1.11`に固定しています。互換性のある依存修正でadvisoryを減らしましたが、残るadvisoryと未検証環境はリリース前に評価してください。Nodeとhostの最低条件はNuxtに合わせて引き上げています。
module/client API、loopback endpointの規則、明示接続の動作、ライセンス条件は維持しています。
ローカルTGZの試験は配布物の動作確認であり、registryの配布確認とは別です。操作・配備・公開には、それぞれの権限と設定が必要です。

## 文書とライセンス

[使い方](https://github.com/nuxtjp/nuxt-local-runtime/blob/main/docs/getting-started.md) · [Schema](schemas) · [実装](https://github.com/nuxtjp/nuxt-local-runtime/tree/main/src) · [テスト](https://github.com/nuxtjp/nuxt-local-runtime/tree/main/test) · [貢献方法](https://github.com/nuxtjp/nuxt-local-runtime/blob/main/CONTRIBUTING.md) · [セキュリティ報告](https://github.com/nuxtjp/nuxt-local-runtime/blob/main/SECURITY.md)

コードは[Apache-2.0](LICENSE)です。[NOTICE](NOTICE)と[以前の許諾](LICENSE-PREVIOUS)を保持してください。
