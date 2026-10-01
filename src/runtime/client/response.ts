export async function boundedJson(
  response: Response,
  maximumBytes: number
): Promise<unknown> {
  if (!response.ok) {
    throw new Error(`local runtime returned HTTP ${response.status}`)
  }
  const contentType = response.headers.get('content-type')?.split(';')[0]?.trim()
  if (contentType !== 'application/json') {
    throw new Error('local runtime response must be application/json')
  }
  const declaredLength = response.headers.get('content-length')
  const contentLength = declaredLength === null ? null : Number(declaredLength)
  if (contentLength !== null
    && (!Number.isSafeInteger(contentLength)
      || contentLength < 0
      || contentLength > maximumBytes)) {
    throw new Error('local runtime response exceeds the byte limit')
  }
  if (!response.body) throw new Error('local runtime response body is missing')
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let byteLength = 0
  while (true) {
    const result = await reader.read()
    if (result.done) break
    byteLength += result.value.byteLength
    if (byteLength > maximumBytes) {
      await reader.cancel()
      throw new Error('local runtime response exceeds the byte limit')
    }
    chunks.push(result.value)
  }
  const bytes = new Uint8Array(byteLength)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  return JSON.parse(text) as unknown
}
