import type {
  LocalRuntimeManifest,
  SessionGrant,
  SessionRequest,
  ViewEnvelope,
  ViewRequest
} from '../shared/types'
import {
  isLocalRuntimeManifest,
  isSessionGrant,
  isViewEnvelope
} from '../shared/guards'
import { requireLoopbackEndpoint, runtimeUrl } from './endpoint'
import { localRequest } from './request'
import { localJson } from './transport'

export interface LocalRuntimeClientOptions {
  endpoint: string
  origin: string
  fetcher?: typeof fetch
  maximumResponseBytes?: number
  timeoutMilliseconds?: number
}

export class LocalRuntimeClient {
  readonly endpoint: URL
  private readonly origin: string
  private readonly fetcher: typeof fetch
  private readonly maximumResponseBytes: number
  private readonly timeoutMilliseconds: number
  private grant: SessionGrant | null = null
  private runtimeManifest: LocalRuntimeManifest | null = null

  constructor(options: LocalRuntimeClientOptions) {
    this.endpoint = requireLoopbackEndpoint(options.endpoint)
    this.origin = new URL(options.origin).origin
    this.fetcher = options.fetcher || fetch
    this.maximumResponseBytes = options.maximumResponseBytes || 256 * 1024
    this.timeoutMilliseconds = options.timeoutMilliseconds || 5000
    if (!Number.isSafeInteger(this.maximumResponseBytes)
      || this.maximumResponseBytes <= 0
      || this.maximumResponseBytes > 8 * 1024 * 1024) {
      throw new Error('maximum response bytes are outside the local boundary')
    }
    if (!Number.isSafeInteger(this.timeoutMilliseconds)
      || this.timeoutMilliseconds < 50
      || this.timeoutMilliseconds > 30_000) {
      throw new Error('timeout is outside the local boundary')
    }
  }

  async manifest(): Promise<LocalRuntimeManifest> {
    const value = await localJson(
      this.fetcher,
      runtimeUrl(this.endpoint, '/v1/manifest'),
      localRequest('GET'),
      this.maximumResponseBytes,
      this.timeoutMilliseconds
    )
    if (!isLocalRuntimeManifest(value)
      || !value.security.allowed_origins.includes(this.origin)) {
      throw new Error('invalid runtime manifest')
    }
    this.runtimeManifest = value
    return value
  }

  async connect(capabilities: string[]): Promise<SessionGrant> {
    if (!this.runtimeManifest) throw new Error('runtime manifest is not loaded')
    if (capabilities.length > 64
      || capabilities.some(capability => !capability || capability.length > 128)) {
      throw new Error('requested capabilities exceed the local boundary')
    }
    const available = new Set(
      this.runtimeManifest.capabilities.map(capability => capability.id)
    )
    if (capabilities.some(capability => !available.has(capability))) {
      throw new Error('requested capability is not declared')
    }
    const request: SessionRequest = {
      schema: 'nuxtjp://local-runtime/session-request/v1',
      origin: this.origin,
      audience: this.origin,
      client_nonce: crypto.randomUUID(),
      requested_capabilities: [...new Set(capabilities)]
    }
    const value = await localJson(
      this.fetcher,
      runtimeUrl(this.endpoint, '/v1/session'),
      localRequest('POST', { body: request }),
      this.maximumResponseBytes,
      this.timeoutMilliseconds
    )
    const expected = [...new Set(capabilities)].sort()
    const observed = isSessionGrant(value)
      ? [...value.granted_capabilities].sort()
      : []
    const now = Math.floor(Date.now() / 1000)
    const limits = this.runtimeManifest.security.limits
    if (!isSessionGrant(value)
      || value.audience !== this.origin
      || value.expires_at_unix_seconds <= now
      || value.expires_at_unix_seconds > now + limits.session_ttl_seconds + 5
      || JSON.stringify(observed) !== JSON.stringify(expected)
      || value.budget.max_messages > limits.max_messages_per_minute
      || value.budget.max_bytes > limits.max_bytes_per_minute) {
      throw new Error('invalid runtime session grant')
    }
    this.grant = value
    return value
  }

  async view(capabilityId: string, viewId: string): Promise<ViewEnvelope> {
    if (!this.grant || !this.runtimeManifest) {
      throw new Error('local runtime session is not connected')
    }
    if (!this.grant.granted_capabilities.includes(capabilityId)) {
      throw new Error('capability was not granted')
    }
    const request: ViewRequest = {
      schema: 'nuxtjp://local-runtime/view-request/v1',
      capability_id: capabilityId,
      view_id: viewId,
      request_nonce: crypto.randomUUID()
    }
    const value = await localJson(
      this.fetcher,
      runtimeUrl(this.endpoint, '/v1/view'),
      localRequest('POST', { body: request, token: this.grant.token }),
      this.maximumResponseBytes,
      this.timeoutMilliseconds
    )
    const capability = this.runtimeManifest.capabilities
      .find(item => item.id === capabilityId)
    if (!capability
      || !isViewEnvelope(value, capability.payload_schema)
      || value.capability_id !== capabilityId
      || value.view_id !== viewId) {
      throw new Error('invalid runtime view')
    }
    return value
  }

  async disconnect(): Promise<void> {
    const token = this.grant?.token
    this.grant = null
    if (!token) return
    await localJson(
      this.fetcher,
      runtimeUrl(this.endpoint, '/v1/session'),
      localRequest('DELETE', { token }),
      this.maximumResponseBytes,
      this.timeoutMilliseconds
    )
  }
}
