# Using @nuxtjp/local-runtime

Connect a browser interface to one explicitly configured local Rust runtime.

## Before you start

The application supplies the allowed origin and capabilities. There is no automatic resource discovery or persistent credential storage.

## First steps

Run from the repository root:

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
```

## How to assess the result

- Start a connection only after an explicit user operation.
- Validate bounded loopback responses and display connection state.

A passing source-level check establishes only what that check observes. Keep missing configuration, unavailable services and unverified deployment paths visible.

## Continue reading

[Repository overview](../README.md)
