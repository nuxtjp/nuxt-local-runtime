import { describe, expect, it } from 'vitest'
import {
  bandAllowsTarget,
  isBrowserVisibleBand
} from '../src/runtime/shared/security'
import { requireLoopbackEndpoint } from '../src/runtime/client/endpoint'
import {
  isLocalRuntimeManifest,
  isSessionGrant,
  isViewEnvelope
} from '../src/runtime/shared/guards'
import { grant, manifest, view } from './fixtures'

describe('closed local runtime boundary', () => {
  it('accepts numeric loopback origins only', () => {
    expect(requireLoopbackEndpoint('http://127.0.0.1:37843').port).toBe('37843')
    expect(requireLoopbackEndpoint('http://[::1]:37843').port).toBe('37843')
    for (const invalid of [
      'http://localhost:37843',
      'https://nerp.jp',
      'http://127.0.0.1:37843/path',
      'http://user@127.0.0.1:37843'
    ]) {
      expect(() => requireLoopbackEndpoint(invalid)).toThrow()
    }
  })

  it('allows each information band through one reviewed boundary', () => {
    expect(bandAllowsTarget('sealed', 'none')).toBe(true)
    expect(bandAllowsTarget('local', 'local-mesh')).toBe(true)
    expect(bandAllowsTarget('session', 'loopback-browser')).toBe(true)
    expect(bandAllowsTarget('control', 'external-control')).toBe(true)
    expect(bandAllowsTarget('session', 'external-control')).toBe(false)
    expect(isBrowserVisibleBand('sealed')).toBe(false)
    expect(isBrowserVisibleBand('session')).toBe(true)
  })

  it('rejects expanded contracts and non-browser view bands', () => {
    expect(isLocalRuntimeManifest(manifest)).toBe(true)
    expect(isSessionGrant(grant)).toBe(true)
    const payloadSchema = manifest.capabilities[0]!.payload_schema
    expect(isViewEnvelope(view, payloadSchema)).toBe(true)
    expect(isLocalRuntimeManifest({ ...manifest, external_actions: true })).toBe(false)
    expect(isSessionGrant({ ...grant, tenant_override: true })).toBe(false)
    expect(isViewEnvelope({ ...view, band: 'local' }, payloadSchema)).toBe(false)
    expect(isViewEnvelope({ ...view, payload: { count: '2' } }, payloadSchema))
      .toBe(false)
    expect(isViewEnvelope({
      ...view,
      payload: { count: 2, raw_detail: 'forbidden' }
    }, payloadSchema)).toBe(false)
    expect(isViewEnvelope({
      ...view,
      payload_schema_id: 'other.schema.v1'
    }, payloadSchema)).toBe(false)
  })
})
