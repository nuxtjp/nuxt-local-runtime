export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[]
): boolean {
  const actual = Object.keys(value).sort()
  return actual.length === keys.length
    && actual.every((key, index) => key === [...keys].sort()[index])
}

export function isText(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isText)
}

export function isSafeCount(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0
}
