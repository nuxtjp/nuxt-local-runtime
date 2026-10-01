import type { RuntimePayloadSchema, ViewEnvelope } from '../types'
import {
  hasExactKeys,
  isRecord,
  isSafeCount,
  isText
} from './primitives'
import { isBrowserVisibleBand } from '../security'
import { matchesPayloadSchema } from './payload'

export function isViewEnvelope(
  value: unknown,
  payloadSchema: RuntimePayloadSchema
): value is ViewEnvelope {
  if (!isRecord(value) || !hasExactKeys(value, [
    'band',
    'capability_id',
    'expires_at_unix_seconds',
    'external_actions',
    'generated_at_unix_seconds',
    'payload',
    'payload_schema_id',
    'schema',
    'view_id'
  ])) return false
  return value.schema === 'nuxtjp://local-runtime/view/v1'
    && isText(value.capability_id)
    && isText(value.view_id)
    && value.payload_schema_id === payloadSchema.id
    && isBrowserVisibleBand(value.band as never)
    && isSafeCount(value.generated_at_unix_seconds)
    && isSafeCount(value.expires_at_unix_seconds)
    && value.expires_at_unix_seconds >= value.generated_at_unix_seconds
    && value.external_actions === false
    && matchesPayloadSchema(value.payload, payloadSchema)
}
