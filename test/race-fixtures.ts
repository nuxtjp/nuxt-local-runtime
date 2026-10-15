import { vi } from 'vitest'
import { grant, manifest, view } from './fixtures'
import { LocalRuntimeClient } from '../src/runtime/client/client'
export const capabilities = ['workflow.issue.read']
export function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((ok, fail) => { resolve = ok; reject = fail })
  return { promise, resolve, reject }
}
export const json = (value: unknown) => new Response(JSON.stringify(value), {
  status: 200, headers: { 'content-type': 'application/json' }
})
export const session = (id: string) => ({ ...grant, token: `synthetic-${id}`, session_id: id,
  expires_at_unix_seconds: Math.floor(Date.now() / 1000) + 200 })
export function transport() {
  const posts: ReturnType<typeof deferred<Response>>[] = []
  const manifests: ReturnType<typeof deferred<Response>>[] = []
  const deletes: { token: string | null; response: ReturnType<typeof deferred<Response>> }[] = []
  const views: (string | null)[] = []
  const control = { delayManifest: false, delayDelete: false, failDelete: false, timeoutDelete: false }
  const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const token = new Headers(init?.headers).get('authorization')
    if (String(input).endsWith('/v1/view')) { views.push(token); return json(view) }
    if (init?.method === 'GET') {
      if (!control.delayManifest) return json(manifest)
      const result = deferred<Response>(); manifests.push(result); return result.promise
    }
    if (init?.method === 'DELETE') {
      const response = deferred<Response>(); deletes.push({ token, response })
      if (control.failDelete) throw new Error('synthetic cleanup failure')
      if (control.timeoutDelete) {
        init.signal?.addEventListener('abort', () => response.reject(new DOMException('aborted', 'AbortError')), { once: true })
        return response.promise
      }
      return control.delayDelete ? response.promise : json({ revoked: true })
    }
    const result = deferred<Response>(); posts.push(result); return result.promise
  })
  const createClient = () => new LocalRuntimeClient({ endpoint: 'http://127.0.0.1:37843',
    origin: 'https://nerp.jp', fetcher, timeoutMilliseconds: 100 })
  return { posts, manifests, deletes, views, control, createClient }
}
