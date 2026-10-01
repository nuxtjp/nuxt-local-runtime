<script setup lang="ts">
const runtime = useLocalRuntime()
const summary = ref<Record<string, unknown> | null>(null)

async function connect(): Promise<void> {
  await runtime.connect(['workflow.issue.read'])
  if (!runtime.connected.value) return
  const view = await runtime.view('workflow.issue.read', 'issue-summary')
  summary.value = view.payload
}

async function disconnect(): Promise<void> {
  await runtime.disconnect()
  summary.value = null
}
</script>

<template>
  <main>
    <h1>NuxtJP Local Runtime Playground</h1>
    <NuxtJpLocalRuntimeStatus :state="runtime.state.value" />
    <div class="actions">
      <button
        type="button"
        :disabled="runtime.state.value.phase === 'connecting'"
        @click="connect"
      >
        明示的に接続
      </button>
      <button type="button" :disabled="!runtime.connected.value" @click="disconnect">
        切断
      </button>
    </div>
    <pre v-if="summary">{{ JSON.stringify(summary, null, 2) }}</pre>
  </main>
</template>

<style scoped>
main {
  display: grid;
  gap: 1rem;
  margin: 4rem auto;
  max-width: 48rem;
  padding: 0 1rem;
}

.actions {
  display: flex;
  gap: .75rem;
}
</style>
