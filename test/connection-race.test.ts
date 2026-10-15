import { describe, expect, it, vi } from 'vitest'
import { createLocalRuntimeConnection } from '../src/runtime/app/connection'
import { capabilities, json, session, transport } from './race-fixtures'
import { manifest } from './fixtures'

describe('Nuxt connection lifecycle with real clients', () => {
  for (const outcome of ['old-success-first', 'new-success-first', 'old-failure-first', 'new-success-old-failure']) {
    it(`publishes only the latest connect: ${outcome}`, async () => {
      const t = transport(); const connection = createLocalRuntimeConnection(t.createClient)
      const old = connection.connect(capabilities)
      await vi.waitFor(() => expect(t.posts).toHaveLength(1))
      const current = connection.connect(capabilities)
      await vi.waitFor(() => expect(t.posts).toHaveLength(2))
      const finishOld = () => outcome.includes('failure')
        ? t.posts[0]!.reject(new Error('synthetic old failure')) : t.posts[0]!.resolve(json(session('old')))
      if (outcome.endsWith('first') && outcome.startsWith('old')) {
        finishOld(); await old
        expect(connection.state.value.phase).toBe('connecting')
        await expect(connection.view(capabilities[0]!, 'issue-summary')).rejects.toThrow('not connected')
      }
      t.posts[1]!.resolve(json(session('new'))); await current
      if (!(outcome.endsWith('first') && outcome.startsWith('old'))) { finishOld(); await old }
      expect(connection.connected.value).toBe(true)
      await connection.view(capabilities[0]!, 'issue-summary')
      expect(t.views).toEqual(['Bearer synthetic-new'])
      expect(t.deletes.map(x => x.token)).toEqual(outcome.includes('failure') ? [] : ['Bearer synthetic-old'])
      await connection.disconnect()
    })
  }
  for (const [phase, outcome] of [['manifest', 'success'], ['manifest', 'failure'], ['session', 'success'], ['session', 'failure']]) {
    it(`disconnect during ${phase} never resurrects a connection: ${outcome}`, async () => {
      const t = transport(); t.control.delayManifest = phase === 'manifest'
      const connection = createLocalRuntimeConnection(t.createClient)
      const old = connection.connect(capabilities)
      await vi.waitFor(() => expect(phase === 'manifest' ? t.manifests : t.posts).toHaveLength(1))
      await connection.disconnect(); await connection.disconnect()
      const pending = phase === 'manifest' ? t.manifests[0]! : t.posts[0]!
      if (outcome === 'failure') pending.reject(new Error('synthetic late failure'))
      else pending.resolve(json(phase === 'manifest' ? manifest : session('old')))
      await old; expect(connection.state.value.phase).toBe('idle')
      await expect(connection.view(capabilities[0]!, 'issue-summary')).rejects.toThrow('not connected')
      expect(t.deletes.map(x => x.token)).toEqual(phase === 'session' && outcome === 'success' ? ['Bearer synthetic-old'] : [])
    })
  }
  for (const cleanup of ['failure', 'timeout']) {
    it(`old grant cleanup cannot change the new connection: ${cleanup}`, async () => {
      const t = transport(); const connection = createLocalRuntimeConnection(t.createClient)
      const old = connection.connect(capabilities)
      await vi.waitFor(() => expect(t.posts).toHaveLength(1))
      const current = connection.connect(capabilities)
      await vi.waitFor(() => expect(t.posts).toHaveLength(2))
      t.posts[1]!.resolve(json(session('new'))); await current
      t.control.failDelete = cleanup === 'failure'; t.control.timeoutDelete = cleanup === 'timeout'
      t.posts[0]!.resolve(json(session('old'))); await old
      expect(connection.state.value.phase).toBe('connected')
      expect(connection.state.value.error).toBe(null)
      await connection.view(capabilities[0]!, 'issue-summary')
      expect(t.views).toEqual(['Bearer synthetic-new'])
      expect(t.deletes.map(x => x.token)).toEqual(['Bearer synthetic-old'])
      t.control.failDelete = false; t.control.timeoutDelete = false
      await connection.disconnect()
    })
  }
  it('a slow old disconnect cannot erase a reconnect; repeated disconnect is safe', async () => {
    const t = transport(); const connection = createLocalRuntimeConnection(t.createClient)
    const first = connection.connect(capabilities)
    await vi.waitFor(() => expect(t.posts).toHaveLength(1)); t.posts[0]!.resolve(json(session('old'))); await first
    t.control.delayDelete = true
    const disconnect = connection.disconnect()
    expect(connection.state.value.phase).toBe('idle')
    const second = connection.connect(capabilities)
    await vi.waitFor(() => expect(t.posts).toHaveLength(2)); t.posts[1]!.resolve(json(session('new'))); await second
    t.deletes[0]!.response.resolve(json({ revoked: true })); await disconnect
    expect(connection.connected.value).toBe(true)
    await connection.view(capabilities[0]!, 'issue-summary'); expect(t.views).toEqual(['Bearer synthetic-new'])
    t.control.delayDelete = false; await connection.disconnect(); await connection.disconnect()
    expect(t.deletes.map(x => x.token)).toEqual(['Bearer synthetic-old', 'Bearer synthetic-new'])
  })
})
