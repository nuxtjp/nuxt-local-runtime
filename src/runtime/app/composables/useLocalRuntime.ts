import { computed, readonly, ref } from 'vue'
import { useRuntimeConfig } from '#imports'
import { LocalRuntimeClient } from '../../client/client'
import type {
  LocalRuntimeState,
  ViewEnvelope
} from '../../shared/types'

export function useLocalRuntime() {
  const config = useRuntimeConfig()
  const state = ref<LocalRuntimeState>({
    phase: 'idle',
    manifest: null,
    error: null
  })
  let client: LocalRuntimeClient | null = null

  async function connect(capabilities: string[] = []): Promise<void> {
    state.value = { phase: 'connecting', manifest: null, error: null }
    try {
      const endpoint = config.public.nuxtJpLocalRuntime.endpoint as string
      client = new LocalRuntimeClient({
        endpoint,
        origin: window.location.origin
      })
      const manifest = await client.manifest()
      await client.connect(capabilities)
      state.value = { phase: 'connected', manifest, error: null }
    } catch (error) {
      client = null
      state.value = {
        phase: error instanceof DOMException && error.name === 'NotAllowedError'
          ? 'denied'
          : 'unavailable',
        manifest: null,
        error: error instanceof Error ? error.message : '接続できませんでした'
      }
    }
  }

  async function view(
    capabilityId: string,
    viewId: string
  ): Promise<ViewEnvelope> {
    if (!client) throw new Error('local runtime is not connected')
    return client.view(capabilityId, viewId)
  }

  async function disconnect(): Promise<void> {
    try {
      await client?.disconnect()
    } finally {
      client = null
      state.value = { phase: 'idle', manifest: null, error: null }
    }
  }

  return {
    state: readonly(state),
    connected: computed(() => state.value.phase === 'connected'),
    connect,
    view,
    disconnect
  }
}
