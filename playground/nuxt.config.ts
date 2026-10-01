import localRuntime from '../src/module'

export default defineNuxtConfig({
  devtools: { enabled: false },
  modules: [[localRuntime, {
    endpoint: 'http://127.0.0.1:37843',
    componentPrefix: 'NuxtJp'
  }]]
})
