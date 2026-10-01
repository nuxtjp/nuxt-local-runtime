import type { SessionGrant } from '../types'
import {
  hasExactKeys,
  isRecord,
  isSafeCount,
  isStringArray,
  isText
} from './primitives'

export function isSessionGrant(value: unknown): value is SessionGrant {
  if (!isRecord(value) || !hasExactKeys(value, [
    'audience',
    'budget',
    'classification_ceiling',
    'expires_at_unix_seconds',
    'external_actions',
    'granted_capabilities',
    'schema',
    'session_id',
    'subject_id',
    'token'
  ])) return false
  const budget = value.budget
  if (!isRecord(budget) || !hasExactKeys(budget, [
    'max_bytes', 'max_messages'
  ])) return false
  return value.schema === 'nuxtjp://local-runtime/session-grant/v1'
    && isText(value.session_id)
    && isText(value.token)
    && isText(value.subject_id)
    && isText(value.audience)
    && isSafeCount(value.expires_at_unix_seconds)
    && isStringArray(value.granted_capabilities)
    && value.granted_capabilities.length <= 64
    && new Set(value.granted_capabilities).size === value.granted_capabilities.length
    && value.classification_ceiling === 'session'
    && isSafeCount(budget.max_messages) && budget.max_messages > 0
    && isSafeCount(budget.max_bytes) && budget.max_bytes > 0
    && value.external_actions === false
}
