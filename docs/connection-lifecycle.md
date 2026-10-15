# Latest-operation connection lifecycle

Each explicit connect/disconnect invalidates older operations. The Nuxt composable
uses a separate client per attempt and publishes only the latest completed attempt.
Disconnect immediately removes the visible client and connection state. An older
manifest/session response or disconnect completion cannot restore or erase state.

The client also enforces operation ownership independently of Nuxt. Late valid
session grants are revoked using only their own token. Cleanup is bounded by the
existing request deadline and cannot replace a newer grant. Cleanup failure leaves
the old attempt unusable; remote revocation is not guaranteed when the server is
unreachable, so the original grant expiry remains the final bound. No cleanup
error contains a token, and no automatic retry or credential renewal is added.

Tests use real clients and controlled synthetic transport responses for manifest/
session delays, reversed completion/failure order, disconnect/reconnect, repeated
operations, and failed/timed-out old-grant cleanup. Run `pnpm test`,
`pnpm typecheck`, and `pnpm build`. No live runtime account is contacted.
