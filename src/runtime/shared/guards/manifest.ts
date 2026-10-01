import type {
  LocalRuntimeManifest,
  RuntimeCapability,
  RuntimeLimits
} from '../types'
import {
  hasExactKeys,
  isRecord,
  isSafeCount,
  isStringArray,
  isText
} from './primitives'
import { isPayloadSchema } from './payload'

const manifestKeys = [
  'capabilities',
  'engine',
  'external_actions',
  'mode',
  'protocol_version',
  'runtime_id',
  'schema',
  'security'
]

function isLimits(value: unknown): value is RuntimeLimits {
  if (!isRecord(value) || !hasExactKeys(value, [
    'max_bytes_per_minute',
    'max_messages_per_minute',
    'max_request_bytes',
    'max_response_bytes',
    'session_ttl_seconds'
  ])) return false
  return isSafeCount(value.max_request_bytes)
    && value.max_request_bytes > 0
    && value.max_request_bytes <= 1024 * 1024
    && isSafeCount(value.max_response_bytes)
    && value.max_response_bytes > 0
    && value.max_response_bytes <= 8 * 1024 * 1024
    && isSafeCount(value.max_messages_per_minute)
    && value.max_messages_per_minute > 0
    && value.max_messages_per_minute <= 600
    && isSafeCount(value.max_bytes_per_minute)
    && value.max_bytes_per_minute > 0
    && value.max_bytes_per_minute <= 64 * 1024 * 1024
    && isSafeCount(value.session_ttl_seconds)
    && value.session_ttl_seconds > 0
    && value.session_ttl_seconds <= 3600
}

function isCapability(value: unknown): value is RuntimeCapability {
  if (!isRecord(value) || !hasExactKeys(value, [
    'description', 'id', 'output_band', 'payload_schema', 'service_id'
  ])) return false
  return isText(value.id) && value.id.length <= 128
    && isText(value.service_id) && value.service_id.length <= 128
    && isText(value.description) && value.description.length <= 4096
    && ['session', 'public'].includes(String(value.output_band))
    && isPayloadSchema(value.payload_schema)
}

function isAllowedOrigins(value: unknown): value is string[] {
  if (!isStringArray(value) || value.length === 0 || value.length > 16) {
    return false
  }
  if (new Set(value).size !== value.length) return false
  return value.every((origin) => {
    try {
      const url = new URL(origin)
      return ['http:', 'https:'].includes(url.protocol)
        && url.origin === origin
        && !url.username
        && !url.password
    } catch {
      return false
    }
  })
}

export function isLocalRuntimeManifest(
  value: unknown
): value is LocalRuntimeManifest {
  if (!isRecord(value) || !hasExactKeys(value, manifestKeys)) return false
  const { engine, security } = value
  if (!isRecord(engine) || !hasExactKeys(engine, [
    'arbitrary_filesystem',
    'arbitrary_network',
    'isolation',
    'kind',
    'status'
  ])) return false
  if (!isRecord(security) || !hasExactKeys(security, [
    'allowed_origins', 'default_band', 'external_egress', 'limits'
  ])) return false
  const capabilitiesValid = Array.isArray(value.capabilities)
    && value.capabilities.length <= 64
    && value.capabilities.every(isCapability)
    && new Set(value.capabilities.map(item => String(item.id))).size
      === value.capabilities.length
  return value.schema === 'nuxtjp://local-runtime/manifest/v1'
    && isText(value.runtime_id)
    && value.protocol_version === '1'
    && ['local-simulation', 'local-production'].includes(String(value.mode))
    && value.external_actions === false
    && engine.kind === 'rust-v8'
    && ['disabled', 'simulated', 'ready'].includes(String(engine.status))
    && ((engine.status === 'ready' && engine.isolation === 'process')
      || (engine.status !== 'ready'
        && engine.isolation === 'in-process-simulation'))
    && engine.arbitrary_network === false
    && engine.arbitrary_filesystem === false
    && security.default_band === 'sealed'
    && security.external_egress === 'deny'
    && isAllowedOrigins(security.allowed_origins)
    && isLimits(security.limits)
    && capabilitiesValid
}
