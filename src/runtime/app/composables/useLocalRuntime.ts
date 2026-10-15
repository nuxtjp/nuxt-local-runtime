import { useRuntimeConfig } from '#imports'
import { LocalRuntimeClient } from '../../client/client'
import { createLocalRuntimeConnection } from '../connection'

export function useLocalRuntime() {
  const config = useRuntimeConfig()
  return createLocalRuntimeConnection(() => new LocalRuntimeClient({
    endpoint: config.public.nuxtJpLocalRuntime.endpoint as string,
    origin: window.location.origin
  }))
}
