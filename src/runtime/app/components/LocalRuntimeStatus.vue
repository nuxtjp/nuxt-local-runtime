<script setup lang="ts">
import type { DeepReadonly } from 'vue'
import type { LocalRuntimeState } from '../../shared/types'

defineProps<{
  state: DeepReadonly<LocalRuntimeState>
}>()
</script>

<template>
  <section
    class="nuxtjp-local-runtime"
    :data-phase="state.phase"
    aria-live="polite"
  >
    <div class="nuxtjp-local-runtime__indicator" aria-hidden="true" />
    <div>
      <strong>{{ state.phase === 'connected' ? 'ローカル接続済み' : 'ローカル接続' }}</strong>
      <p v-if="state.manifest">
        {{ state.manifest.runtime_id }} ·
        V8 {{ state.manifest.engine.status }} ·
        外部送信 {{ state.manifest.security.external_egress }}
      </p>
      <p v-else-if="state.error">{{ state.error }}</p>
      <p v-else>明示的に接続するまでローカル通信は開始されません。</p>
    </div>
  </section>
</template>
