import { boundedJson } from './response'

export async function localJson(
  fetcher: typeof fetch,
  url: URL,
  init: RequestInit,
  maximumBytes: number,
  timeoutMilliseconds: number
): Promise<unknown> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMilliseconds)
  try {
    const response = await fetcher(url, { ...init, signal: controller.signal })
    return await boundedJson(response, maximumBytes)
  } finally {
    clearTimeout(timer)
  }
}
