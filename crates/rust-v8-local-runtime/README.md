# rust-v8-local-runtime

ブラウザと許可されたローカルサービスを、制限付きのループバックAPIで接続できます。

## 利用前の確認

実装済みの範囲、必要な依存関係、検証コマンドを以下の英語説明に併記しています。操作・配備・公開は、それぞれの権限と設定を確認してから実施してください。

## 使い方

リポジトリ内のサンプル・スキーマ・実装を確認し、用途に必要な入力を明示して利用します。下記のGetting startedに、現行設定に対応する検証コマンドを示しています。

検証結果は実行した範囲だけを示します。未実装の機能、未設定の接続、配備環境の確認を合格扱いにしないでください。

## English

Host a bounded loopback connection between a Nuxt browser session and declared local services.

## What you can do

- Validate origins, capability schemas and response limits.
- Delegate view generation through a selected engine boundary.

## Current scope

The operator supplies reviewed configuration. Host readiness does not establish that every service or engine is available.

Package distribution is not activated by this documentation. Use the checked-in source and the declared dependency versions; published availability must be verified separately.

## Getting started

Install Rust 1.97 or newer and make the declared dependencies available. Use the configured private registry when a dependency is not distributed publicly. Run from this repository:

```sh
cargo test --locked
```

## Examples and interface details

## Payload contracts

Every capability owns one allowlisted payload schema:

```json
{
  "payload_schema": {
    "id": "nuxtjp.workflow-issue-summary.v1",
    "fields": [
      { "name": "open_count", "kind": "count" },
      { "name": "source", "kind": "text" },
      { "name": "local_only", "kind": "boolean" }
    ]
  }
}
```

Fixtures and engine results must carry the same `payload_schema_id`. Payloads
must be objects with exactly the declared keys. Values are limited to bounded
text, unsigned integer counts, and booleans; arrays, nested objects, null,
floating-point values, undeclared keys, and omitted keys are rejected. The
host validates fixtures at startup and validates engine output again before it
crosses the loopback-browser boundary.

Schema and field identifiers are limited to 128 ASCII alphanumeric,
underscore, hyphen, or dot characters. A schema contains 1–32 unique fields
and text values are limited to 4096 UTF-8 bytes. Reusing one schema ID with a
different field definition is rejected.

## Engine modes

`local-simulation` remains the portable default. It accepts only
`engine_status: simulated`, configured fixture views, and no process settings.
The NERP and Hibee examples and Canonical smoke stages continue to use this
mode.

`local-production` is an explicit opt-in. It accepts only
`engine_status: ready`, no simulation fixtures, and a
`nuxtjp://local-runtime/process-engine/v1` configuration. The host does not
link V8 or depend on worker source. It implements only the worker's versioned
stdio JSON protocol.

Before every invocation the host checks:

- an absolute canonical regular non-symlink executable path;
- the executable SHA-256 using the same file descriptor that will be run;
- the fixed script ID and script SHA-256;
- configuration expiry and bounded input, output, heap, and timeout limits.

On Linux the verified descriptor is executed through `/proc/self/fd` with an
empty environment, bounded stdin/stdout/stderr pipes, and a host-side kill
deadline. Unknown JSON fields, response identity changes, correlation changes,
and payload-schema changes fail closed.

## Commands

`validate-config` does not start a server. It emits one
`nuxtjp://local-runtime/config-validation/v1` JSON result.

```bash
cargo run --locked --offline -- validate-config examples/local-simulation.json
cargo run --locked --offline -- simulate examples/local-simulation.json
cargo run --locked --offline -- serve examples/local-simulation.json
```

`serve` is a foreground process. The example binds to
`127.0.0.1:37843`; stop it with `Ctrl+C`.

### Opt-in ready validation

Copy `examples/local-ready.template.json` to
`examples/local-ready.generated.json`, then replace `worker_path` with the
absolute built worker path and `worker_sha256` with `sha256sum` output. The
generated file is ignored because it is device-specific.

```bash
cargo run --locked --offline -- \
  validate-config examples/local-ready.generated.json
cargo run --locked --offline -- \
  render examples/local-ready.generated.json
```

`render` processes one complete session/view flow without opening a server.
It is rejected for simulation configurations, just as `simulate` is rejected
for ready configurations.

## Documentation and source

[Interface reference](docs/interface-reference.md)

[Usage guide](docs/getting-started.md)

[Examples](examples) · [Schemas](schemas) · [Implementation and public interfaces](src) · [Verification cases](tests) · [Contributing](CONTRIBUTING.md) · [Security reporting](SECURITY.md) · [License](LICENSE) · [Attribution notices](NOTICE)
