import type {
  PayloadScalar,
  RuntimePayloadField,
  RuntimePayloadSchema
} from '../types'
import {
  hasExactKeys,
  isRecord,
  isSafeCount,
  isText
} from './primitives'

const fieldName = /^[a-z][a-z0-9_]{0,63}$/

function isPayloadField(value: unknown): value is RuntimePayloadField {
  return isRecord(value)
    && hasExactKeys(value, ['kind', 'name'])
    && isText(value.name)
    && fieldName.test(value.name)
    && ['text', 'count', 'boolean'].includes(String(value.kind))
}

export function isPayloadSchema(
  value: unknown
): value is RuntimePayloadSchema {
  if (!isRecord(value) || !hasExactKeys(value, ['fields', 'id'])) return false
  if (!isText(value.id)
    || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(value.id)
    || !Array.isArray(value.fields)) return false
  if (value.fields.length === 0 || value.fields.length > 32) return false
  if (!value.fields.every(isPayloadField)) return false
  return new Set(value.fields.map(field => field.name)).size === value.fields.length
}

function matchesKind(value: unknown, kind: string): value is PayloadScalar {
  if (kind === 'text') {
    return isText(value) && new TextEncoder().encode(value).byteLength <= 4096
  }
  if (kind === 'count') return isSafeCount(value)
  return kind === 'boolean' && typeof value === 'boolean'
}

export function matchesPayloadSchema(
  value: unknown,
  schema: RuntimePayloadSchema
): value is Record<string, PayloadScalar> {
  if (!isPayloadSchema(schema) || !isRecord(value)) return false
  if (!hasExactKeys(value, schema.fields.map(field => field.name))) return false
  return schema.fields.every(field => matchesKind(value[field.name], field.kind))
}
