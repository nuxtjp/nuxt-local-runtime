# nuxtjp-vite-backend

Vite Backend Integration for a Rust HTTP backend, without server-side JavaScript.
This source-only Apache-2.0 crate belongs to NuxtJP's existing local-runtime
repository. Pin its public Git commit when consuming it; it is not on crates.io.
It does not change the existing Nuxt npm module or Rust/V8 engine protocol.

Use `ProductionAssets::read` with a reviewed `.vite/manifest.json` stream and
`entry("src/main.ts")` to generate stylesheet/module/preload tags. Development
uses an explicitly selected `DevelopmentAssets` numeric-loopback HTTP origin;
Vite must be started separately. There is no probing, environment discovery,
implicit fallback, npm execution or embedded JS runtime.

The published `vite-manifest =0.1.0` supplies manifest types, parsing and imported
chunk traversal. This adapter supplies missing validation: 256 KiB input, 256
chunks, 2048 total references, 64 references per list and depth 16, missing imports,
known fields, relative output paths and nonempty entry selection. URLs percent-
encode individual path segments. Dynamic chunks are validated, not eagerly loaded.

Applications own the HTTP server, host/origin/request admission, static-file
containment, status codes, CSP, product routes and grants. `files()` lists reviewed
build outputs, not permission to read any similarly named filesystem path.
API and missing-asset errors must not fall back to SPA HTML. Build assets are not
identity evidence and the manifest is not a signature or authenticity receipt.

This is a limited asset adapter, not a Vite implementation or a general Nitro/SSR
replacement. CSS-only entries and unknown manifest fields require explicit support.

## Existing implementations reviewed

- vite-rust 0.2.4 owns mode discovery, heartbeat/fallback and unbounded file reads;
  adapting those behaviors would introduce unnecessary runtime effects here.
- vite-rs 0.3.0 owns compile-time build/development processes and embedding. NERP
  needs an explicit frontend build and separately owned process lifecycle.
- in-vite 0.1.4 silently skips missing imports and recursively walks without a
  visited set. The chosen parser exposes the manifest for bounded pre-validation.

Official format and rendering order: https://vite.dev/guide/backend-integration.html
Parser source: https://github.com/JadedBlueEyes/vite-manifest

Verification: `cargo test --locked -p nuxtjp-vite-backend` and Clippy. An independent
Vite-built consumer must pass before a product switches its server runtime.


## Vite module identity boundary (0.1.1)

Manifest keys, `imports` and `dynamicImports` are bounded opaque module graph
identifiers, not paths passed to the filesystem or HTML. Actual Vite 8/Nuxt UI
output uses `../node_modules/.../Toast.vue` for a dynamic source outside the web
root. Those source identifiers remain usable only as graph references. Empty,
control-containing or oversized keys, missing references and unknown interface
fields are still refused. `file`, `css` and `assets` remain strictly validated
local relative output paths. Only those output paths reach generated tags or the
caller's file reader. Static/dynamic graph references retain existing limits.

The committed Vite 8/Nuxt UI manifest is an actual NERP hosted build fixture. It
exercises CSS, a dynamic Toast chunk and a source outside the browser root,
without starting Nuxt, Node SSR or a browser at product runtime. The source-only
crate remains unpublished to crates.io; callers must pin an accepted public Git
commit and run their actual HTTP/browser acceptance.
