import { describe, expect, it, vi } from 'vitest'
import { LocalRuntimeClient } from '../src/runtime/client/client'
import { grant, manifest, view } from './fixtures'

function jsonResponse(value: unknown): Response {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  })
}

describe('local runtime client', () => {
  it('performs explicit bounded local session and view calls', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(jsonResponse(manifest))
      .mockResolvedValueOnce(jsonResponse(grant))
      .mockResolvedValueOnce(jsonResponse(view))
      .mockResolvedValueOnce(jsonResponse({ revoked: true }))
    const client = new LocalRuntimeClient({
      endpoint: 'http://127.0.0.1:37843',
      origin: 'https://nerp.jp',
      fetcher
    })

    expect((await client.manifest()).runtime_id).toBe('local-simulation')
    expect((await client.connect(['workflow.issue.read'])).external_actions).toBe(false)
    expect((await client.view('workflow.issue.read', 'issue-summary')).payload)
      .toEqual({ count: 2 })
    expect(fetcher).toHaveBeenCalledTimes(3)
    const [, sessionInit] = fetcher.mock.calls[1]!
    expect(sessionInit).toMatchObject({
      credentials: 'omit',
      redirect: 'error',
      cache: 'no-store'
    })
    await client.disconnect()
    expect(fetcher).toHaveBeenCalledTimes(4)
  })

  it('rejects ungranted capability and oversized responses', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(jsonResponse(manifest))
      .mockResolvedValueOnce(jsonResponse({ data: 'x'.repeat(2048) }))
    const client = new LocalRuntimeClient({
      endpoint: 'http://127.0.0.1:37843',
      origin: 'https://nerp.jp',
      fetcher,
      maximumResponseBytes: 1024
    })
    await client.manifest()
    await expect(client.connect(['unknown.read']))
      .rejects.toThrow('not declared')
    await expect(client.connect([])).rejects.toThrow('byte limit')
    await expect(client.view('unknown', 'summary')).rejects.toThrow('not connected')
  })

  it('aborts a local runtime that does not respond', async () => {
    const fetcher = vi.fn((_input: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new DOMException('aborted', 'AbortError'))
        })
      }))
    const client = new LocalRuntimeClient({
      endpoint: 'http://127.0.0.1:37843',
      origin: 'https://nerp.jp',
      fetcher,
      timeoutMilliseconds: 50
    })
    await expect(client.manifest()).rejects.toMatchObject({ name: 'AbortError' })
  })
})
