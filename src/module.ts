import {
  addComponent,
  addImports,
  createResolver,
  defineNuxtModule
} from '@nuxt/kit'
import type { NuxtModule } from '@nuxt/schema'

export interface ModuleOptions {
  endpoint: string
  componentPrefix: string
}

const localRuntimeModule: NuxtModule<ModuleOptions> = defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@nuxtjp/local-runtime',
    configKey: 'nuxtJpLocalRuntime',
    compatibility: { nuxt: '^4.5.0' }
  },
  defaults: {
    endpoint: 'http://127.0.0.1:37843',
    componentPrefix: 'NuxtJp'
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)
    nuxt.options.runtimeConfig.public.nuxtJpLocalRuntime = {
      endpoint: options.endpoint
    }
    addComponent({
      name: `${options.componentPrefix}LocalRuntimeStatus`,
      filePath: resolver.resolve('./runtime/app/components/LocalRuntimeStatus.vue')
    })
    addImports({
      name: 'useLocalRuntime',
      from: resolver.resolve('./runtime/app/composables/useLocalRuntime')
    })
    const stylesheet = resolver.resolve('./runtime/app/assets/local-runtime.css')
    if (!nuxt.options.css.includes(stylesheet)) {
      nuxt.options.css.push(stylesheet)
    }
  }
})

export default localRuntimeModule
