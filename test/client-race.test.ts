import { describe, expect, it, vi } from 'vitest'
import { capabilities, json, session, transport } from './race-fixtures'
import { manifest } from './fixtures'

describe('real client latest-operation ownership', () => {
  for (const cleanup of ['normal', 'failure', 'timeout']) {
    it(`late old grant is revoked without clearing new session: ${cleanup}`, async () => {
      const t = transport(); const client = t.createClient(); await client.manifest()
      const old = client.connect(capabilities).catch(error => error)
      const current = client.connect(capabilities)
      await vi.waitFor(() => expect(t.posts).toHaveLength(2))
      t.posts[1]!.resolve(json(session('new'))); await current
      t.control.failDelete = cleanup === 'failure'; t.control.timeoutDelete = cleanup === 'timeout'
      t.posts[0]!.resolve(json(session('old')))
      expect(await old).toBeInstanceOf(Error)
      expect(t.deletes.map(x => x.token)).toEqual(['Bearer synthetic-old'])
      await client.view(capabilities[0]!, 'issue-summary')
      expect(t.views).toEqual(['Bearer synthetic-new'])
      t.control.failDelete = false; t.control.timeoutDelete = false
      await client.disconnect(); await client.disconnect()
      expect(t.deletes.map(x => x.token)).toEqual(['Bearer synthetic-old', 'Bearer synthetic-new'])
    })
  }
  it('disconnect invalidates a manifest response that has not arrived', async () => {
    const t = transport(); t.control.delayManifest = true; const client = t.createClient()
    const old = client.manifest().catch(error => error)
    await client.disconnect(); t.manifests[0]!.resolve(json(manifest))
    expect(await old).toBeInstanceOf(Error)
    await expect(client.connect(capabilities)).rejects.toThrow('manifest is not loaded')
  })
  it('late failed connect cannot clear a newer grant', async () => {
    const t = transport(); const client = t.createClient(); await client.manifest()
    const old = client.connect(capabilities).catch(error => error)
    const current = client.connect(capabilities)
    await vi.waitFor(() => expect(t.posts).toHaveLength(2))
    t.posts[1]!.resolve(json(session('new'))); await current
    t.posts[0]!.reject(new Error('synthetic old failure')); expect(await old).toBeInstanceOf(Error)
    await client.view(capabilities[0]!, 'issue-summary'); expect(t.views).toEqual(['Bearer synthetic-new'])
    await client.disconnect()
  })
})
