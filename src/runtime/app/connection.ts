import { computed, readonly, ref } from 'vue'
import type { LocalRuntimeClient } from '../client/client'
import type { LocalRuntimeState, ViewEnvelope } from '../shared/types'

/** Own each connection attempt separately; only the latest operation publishes state. */
export function createLocalRuntimeConnection(createClient: () => LocalRuntimeClient) {
  const state = ref<LocalRuntimeState>({ phase: 'idle', manifest: null, error: null })
  let generation = 0
  let client: LocalRuntimeClient | null = null
  let pending: LocalRuntimeClient | null = null

  async function connect(capabilities: string[] = []): Promise<void> {
    const operation = ++generation
    const previous = pending || client
    client = null
    pending = null
    state.value = { phase: 'connecting', manifest: null, error: null }
    let attempt: LocalRuntimeClient | null = null
    try {
      attempt = createClient()
      pending = attempt
      await previous?.disconnect()
      if (operation !== generation) return
      const manifest = await attempt.manifest()
      await attempt.connect(capabilities)
      if (operation !== generation) {
        await attempt.disconnect()
        return
      }
      client = attempt
      pending = null
      state.value = { phase: 'connected', manifest, error: null }
    } catch (error) {
      // A newer operation already invalidated this client's pending requests.
      if (operation !== generation) return
      try { await attempt?.disconnect() } catch { /* the bounded cleanup cannot reactivate state */ }
      if (operation !== generation) return
      pending = null
      client = null
      state.value = {
        phase: error instanceof DOMException && error.name === 'NotAllowedError' ? 'denied' : 'unavailable',
        manifest: null,
        error: error instanceof Error ? error.message : '接続できませんでした'
      }
    }
  }

  async function view(capabilityId: string, viewId: string): Promise<ViewEnvelope> {
    if (!client || state.value.phase !== 'connected') throw new Error('local runtime is not connected')
    return client.view(capabilityId, viewId)
  }

  async function disconnect(): Promise<void> {
    ++generation
    const previous = pending || client
    pending = null
    client = null
    state.value = { phase: 'idle', manifest: null, error: null }
    await previous?.disconnect()
  }

  return { state: readonly(state), connected: computed(() => state.value.phase === 'connected'), connect, view, disconnect }
}
